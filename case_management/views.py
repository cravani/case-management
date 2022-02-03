import re
from datetime import date, timedelta
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, mixins
from rest_framework.parsers import MultiPartParser, FormParser

from django.views import generic

from django.db import connection

from django.contrib.auth.models import AnonymousUser

from django.http import HttpResponseBadRequest

from case_management.serializers import (
    CaseOfficeSerializer,
    CaseTypeSerializer,
    ClientSerializer,
    LegalCaseSerializer,
    MeetingSerializer,
    UserSerializer,
    LogSerializer,
    LegalCaseFileSerializer,
)
from case_management.models import (
    CaseOffice,
    CaseType,
    Client,
    LegalCase,
    Meeting,
    User,
    Log,
    LegalCaseFile,
)
from case_management import queries

import time


def get_user(request):
    if isinstance(request.user, AnonymousUser):
        return None
    return request.user


class LoggedModelViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        serializer.save(created_by=get_user(self.request))

    def perform_update(self, serializer):
        serializer.save(updated_by=get_user(self.request))


class UpdateRetrieveViewSet(
    mixins.UpdateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """
    A viewset that provides just the `update', and `retrieve` actions.

    To use it, override the class and set the `.queryset` and
    `.serializer_class` attributes.
    """

    pass


class CreateListRetrieveViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    A viewset that provides just the `create', 'list', and `retrieve` actions.

    To use it, override the class and set the `.queryset` and
    `.serializer_class` attributes.
    """

    pass


class Index(generic.TemplateView):
    template_name = "index.html"


class CustomObtainAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response(
            {
                'token': token.key,
                'user_id': user.pk,
            }
        )


class CaseOfficeViewSet(LoggedModelViewSet):
    queryset = CaseOffice.objects.all()
    serializer_class = CaseOfficeSerializer


class CaseTypeViewSet(LoggedModelViewSet):
    queryset = CaseType.objects.all()
    serializer_class = CaseTypeSerializer


class ClientViewSet(LoggedModelViewSet):
    serializer_class = ClientSerializer

    def get_queryset(self):
        queryset = Client.objects.all()
        case_office = self.request.query_params.get('caseOffice')
        user = self.request.query_params.get('user')
        if case_office is not None and user is not None:
            raise ValidationError(
                'Query parameters "caseOffice" and "user" cannot be used together'
            )
        if case_office is not None:
            queryset = Client.objects.filter(
                legal_cases__case_offices__id=case_office
            ).distinct('id')
        if user is not None:
            queryset = Client.objects.filter(
                users__id=user
            ).distinct('id')
        return queryset


class LegalCaseViewSet(LoggedModelViewSet):
    queryset = LegalCase.objects.all()
    serializer_class = LegalCaseSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['client']

    def perform_create(self, serializer):
        try:
            next_id = LegalCase.objects.latest('id').id + 1
        except LegalCase.DoesNotExist:
            next_id = 1
        case_office = CaseOffice.objects.get(pk=self.request.data['case_offices'][0])
        case_office_code = case_office.case_office_code
        generated_case_number = (
            f'{case_office_code}/{time.strftime("%y%m")}/{str(next_id).zfill(4)}'
        )
        serializer.save(case_number=generated_case_number)


class MeetingViewSet(LoggedModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['legal_case']


class LegalCaseFileViewSet(LoggedModelViewSet):
    parser_classes = (MultiPartParser, FormParser)
    queryset = LegalCaseFile.objects.all()
    serializer_class = LegalCaseFileSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['legal_case']


class UserViewSet(UpdateRetrieveViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class LogViewSet(CreateListRetrieveViewSet):
    queryset = Log.objects.all()
    serializer_class = LogSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['parent_id', 'parent_type', 'target_id', 'target_type']


def _get_summary_months_range(request):
    months = {'start': None, 'end': None}
    month_input_pattern = re.compile('^([0-9]{4})-(0[1-9]|1[0-2])$')
    for month in list(months):
        query_param = f'{month}Month'
        query_param_input = request.query_params.get(query_param, None)
        if query_param_input is not None:
            match = month_input_pattern.match(query_param_input)
            if match:
                year_input = int(match.group(1))
                month_input = int(match.group(2))
                months[month] = date(year=year_input, month=month_input, day=1)
            else:
                return HttpResponseBadRequest(
                    f'{query_param} query param must be in format yyyy-mm'
                )
    if months['end'] is None:
        if months['start'] is None:
            months['end'] = date.today()
        else:
            months['end'] = (months['start'] + timedelta(days=30 * 11.5)).replace(day=1)
    if months['start'] is None:
        months['start'] = (months['end'] - timedelta(days=30 * 10.5)).replace(day=1)
    start_month = months['start'].strftime("%Y-%m-%d")
    end_month = months['end'].strftime("%Y-%m-%d")
    return start_month, end_month


def _get_summary_date_range(request):
    dates = {'start': None, 'end': None}
    date_input_pattern = re.compile('^([0-9]{4})-(0[1-9]|1[0-2])-([0-2][1-9]|3[0-1])$')
    for d in list(dates):
        query_param = f'{d}Date'
        query_param_input = request.query_params.get(query_param, None)
        if query_param_input is not None:
            match = date_input_pattern.match(query_param_input)
            if match:
                year_input = int(match.group(1))
                month_input = int(match.group(2))
                day_input = int(match.group(3))
                dates[d] = date(year=year_input, month=month_input, day=day_input)
            else:
                return HttpResponseBadRequest(
                    f'{query_param} query param must be in format yyyy-mm-dd'
                )
    today = date.today()
    if dates['start'] is None:
        dates['start'] = date.today().replace(year = today.year - 1, day=1)
    if dates['end'] is None:
        dates['end'] = today
    start_date = dates['start'].strftime("%Y-%m-%d")
    end_date = dates['end'].strftime("%Y-%m-%d")
    return start_date, end_date

@api_view(['GET'])
def range_summary(request):
    start_date, end_date = _get_summary_date_range(request)
    with connection.cursor() as cursor:
        cursor.execute(queries.range_summary(start_date, end_date))
        row = cursor.fetchone()
    response = {
        'startDate': start_date,
        'endDate': end_date,
        'dataPerCaseOffice': row[0]
    }
    return Response(response)

@api_view(['GET'])
def daily_summary(request):
    start_month, end_month = _get_summary_months_range(request)
    with connection.cursor() as cursor:
        cursor.execute(queries.daily_summary(start_month, end_month))
        row = cursor.fetchone()
    response = {
        'startMonth': start_month,
        'endMonth': end_month,
        'dataPerCaseOffice': row[0]
    }
    return Response(response)


@api_view(['GET'])
def monthly_summary(request):
    start_month, end_month = _get_summary_months_range(request)
    with connection.cursor() as cursor:
        cursor.execute(queries.monthly_summary(start_month, end_month))
        row = cursor.fetchone()
    response = {
        'startMonth': start_month,
        'endMonth': end_month,
        'dataPerCaseOffice': row[0]
    }
    return Response(response)
