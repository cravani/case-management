import re
from datetime import date, timedelta
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, mixins
from rest_framework.parsers import MultiPartParser, FormParser

from django.core.exceptions import BadRequest, FieldError

from django.views import generic

from django.db import connection

from django.contrib.auth.models import AnonymousUser

from django.http import HttpResponseBadRequest

from case_management.auth import (
    InAdminGroup,
    InReportingGroup,
    InAdviceOfficeAdminGroup,
    InCaseWorkerGroup,
    check_create_update_permission,
    check_scoped_list_permission,
    check_scoped_reporting_permision
)

from case_management.serializers import (
    CaseOfficeSerializer,
    CaseTypeSerializer,
    ClientSerializer,
    LegalCaseSerializer,
    CaseUpdateSerializer,
    FileSerializer,
    MeetingSerializer,
    NoteSerializer,
    UserListSerializer,
    UserSerializer,
    LogSerializer,
)
from case_management.models import (
    CaseOffice,
    CaseType,
    Client,
    LegalCase,
    CaseUpdate,
    File,
    Meeting,
    Note,
    User,
    Log,
)
from case_management import queries

import time


def get_user(request):
    if isinstance(request.user, AnonymousUser):
        return None
    return request.user


class LoggedModelViewSet(viewsets.ModelViewSet):
    permission_scope_query_param = 'caseOffice'

    @property
    def permission_scope_query_param_values(self):
        return [self.request.user.case_office.id]

    def get_permissions(self):
        permission_classes = [InAdminGroup |
                              InAdviceOfficeAdminGroup | InCaseWorkerGroup]
        if self.action == 'list':
            check_scoped_list_permission(self.request, self)
        if self.action == 'create':
            check_create_update_permission(self.request)
        elif self.action == 'destroy':
            permission_classes = [InAdminGroup]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        user = get_user(self.request)
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        serializer.save(updated_by=get_user(self.request))


class UpdateRetrieveViewSet(
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    """
    A viewset that provides just the `update', and `retrieve` actions.

    To use it, override the class and set the `.queryset` and
    `.serializer_class` attributes.
    """
    permission_classes = [InAdminGroup]


class ListViewSet(
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    """
    A viewset that provides just the `list` action.
    """
    permission_scope_query_param = 'caseOffice'

    @property
    def permission_scope_query_param_values(self):
        return [self.request.user.case_office.id]

    def get_permissions(self):
        permission_classes = [InAdminGroup | InReportingGroup |
                              InAdviceOfficeAdminGroup | InCaseWorkerGroup]
        check_scoped_list_permission(self.request, self)
        return [permission() for permission in permission_classes]


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
    allow_listing_without_case_office_filter = True
    queryset = CaseType.objects.all()
    serializer_class = CaseTypeSerializer


class ClientViewSet(LoggedModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        case_office = self.request.query_params.get('caseOffice')
        user = self.request.query_params.get('user')
        if case_office is not None:
            queryset = queryset.filter(
                legal_cases__case_offices__id=case_office
            ).distinct('id')
        if user is not None:
            queryset = queryset.filter(
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
        case_office = CaseOffice.objects.get(
            pk=self.request.data['case_offices'][0])
        case_office_code = case_office.case_office_code
        generated_case_number = (
            f'{case_office_code}/{time.strftime("%y%m")}/{str(next_id).zfill(4)}'
        )
        serializer.validated_data['case_number'] = generated_case_number
        super().perform_create(serializer)

    def get_queryset(self):
        queryset = super().get_queryset()
        case_office = self.request.query_params.get('caseOffice')
        if case_office is not None:
            queryset = queryset.filter(
                case_offices__id=case_office
            ).distinct('id')
        return queryset


class CaseUpdateViewSet(LoggedModelViewSet):
    queryset = CaseUpdate.objects.all()
    serializer_class = CaseUpdateSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['legal_case']


class FileViewSet(LoggedModelViewSet):
    parser_classes = (MultiPartParser, FormParser)
    queryset = File.objects.all()
    serializer_class = FileSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['legal_case']


class MeetingViewSet(LoggedModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['legal_case']


class NoteViewSet(LoggedModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['legal_case']


class UserListViewSet(ListViewSet):
    queryset = User.objects.all()
    serializer_class = UserListSerializer


class UserViewSet(UpdateRetrieveViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class LogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [InAdminGroup |
                          InAdviceOfficeAdminGroup | InCaseWorkerGroup]
    queryset = Log.objects.all().order_by('-id')
    serializer_class = LogSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['parent_id', 'parent_type', 'target_id', 'target_type']

    permission_scope_query_param = 'parent_id'

    @property
    def permission_scope_query_param_values(self):
        parent_type = self.request.query_params.get('parent_type')
        if parent_type != 'LegalCase':
            raise ValidationError('Must provide parent_type=LegalCase')
        parent_id = self.request.query_params.get('parent_id')
        user_case_office = self.request.user.case_office.id
        legalcase_case_offices = LegalCase.objects.filter(
            case_offices__id=user_case_office).values_list('id', flat=True)
        return legalcase_case_offices

    def get_permissions(self):
        if self.action == 'list':
            check_scoped_list_permission(self.request, self)
        return [permission() for permission in self.permission_classes]


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
            months['end'] = (months['start'] +
                             timedelta(days=30 * 11.5)).replace(day=1)
    if months['start'] is None:
        months['start'] = (
            months['end'] - timedelta(days=30 * 10.5)).replace(day=1)
    start_month = months['start'].strftime("%Y-%m-%d")
    end_month = months['end'].strftime("%Y-%m-%d")
    return start_month, end_month


def _get_summary_date_range(request):
    dates = {'start': None, 'end': None}
    date_input_pattern = re.compile(
        '^([0-9]{4})-(0[1-9]|1[0-2])-([0-2][1-9]|3[0-1])$')
    for d in list(dates):
        query_param = f'{d}Date'
        query_param_input = request.query_params.get(query_param, None)
        if query_param_input is not None:
            match = date_input_pattern.match(query_param_input)
            if match:
                year_input = int(match.group(1))
                month_input = int(match.group(2))
                day_input = int(match.group(3))
                dates[d] = date(year=year_input,
                                month=month_input, day=day_input)
            else:
                return HttpResponseBadRequest(
                    f'{query_param} query param must be in format yyyy-mm-dd'
                )
    today = date.today()
    if dates['start'] is None:
        dates['start'] = date.today().replace(year=today.year - 1, day=1)
    if dates['end'] is None:
        dates['end'] = today
    start_date = dates['start'].strftime("%Y-%m-%d")
    end_date = dates['end'].strftime("%Y-%m-%d")
    return start_date, end_date


@api_view(['GET'])
@permission_classes([InAdminGroup | InReportingGroup | InAdviceOfficeAdminGroup])
def range_summary(request):
    check_scoped_reporting_permision(request)
    start_date, end_date = _get_summary_date_range(request)
    case_office = request.query_params.get('caseOffice')
    with connection.cursor() as cursor:
        cursor.execute(queries.range_summary(
            start_date, end_date, case_office))
        row = cursor.fetchone()
    response = {
        'startDate': start_date,
        'endDate': end_date,
        'dataPerCaseOffice': row[0]
    }
    return Response(response)


@api_view(['GET'])
@permission_classes([InAdminGroup | InReportingGroup | InAdviceOfficeAdminGroup])
def daily_summary(request):
    check_scoped_reporting_permision(request)
    start_month, end_month = _get_summary_months_range(request)
    case_office = request.query_params.get('caseOffice')
    with connection.cursor() as cursor:
        cursor.execute(queries.daily_summary(
            start_month, end_month, case_office))
        row = cursor.fetchone()
    response = {
        'startMonth': start_month,
        'endMonth': end_month,
        'dataPerCaseOffice': row[0]
    }
    return Response(response)


@api_view(['GET'])
@permission_classes([InAdminGroup | InReportingGroup | InAdviceOfficeAdminGroup])
def monthly_summary(request):
    check_scoped_reporting_permision(request)
    start_month, end_month = _get_summary_months_range(request)
    case_office = request.query_params.get('caseOffice')
    with connection.cursor() as cursor:
        cursor.execute(queries.monthly_summary(
            start_month, end_month, case_office))
        row = cursor.fetchone()
    response = {
        'startMonth': start_month,
        'endMonth': end_month,
        'dataPerCaseOffice': row[0]
    }
    return Response(response)
