import React from "react";
import { useHistory } from "react-router-dom";
import LayoutSimple from "../components/layoutSimple";
import i18n from "../i18n";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import CircularProgress from "@mui/material/CircularProgress";
import SnackbarAlert from "../components/general/snackBar";
import { LocationState } from "../types";
import { getCaseOffices, getCaseTypes } from "../api";
import { CaseOfficesContext } from "../contexts/caseOfficesContext";
import { CaseTypesContext } from "../contexts/caseTypesContext";

import { RedirectIfLoggedIn, UserInfo } from "../auth";
import { authenticate, getUser } from "../api";
import { FormControl, Grid, Input, InputLabel } from "@material-ui/core";
import { useStyles } from "../utils";

const Page = () => {
  RedirectIfLoggedIn();
  const classes = useStyles();
  const history = useHistory();
  const [loginError, setLoginError] = React.useState<boolean>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [showSnackbar, setShowSnackbar] = React.useState<LocationState>({
    open: false,
    message: "",
    severity: undefined,
  });
  // eslint-disable-next-line
  const [contextOffices, setContextOffices] = React.useContext(CaseOfficesContext);
  // eslint-disable-next-line
  const [contextCaseTypes, setContextCaseTypes] = React.useContext(CaseTypesContext);

  React.useEffect(() => {
    const resetState = async () => {
      setTimeout(() => {
        setShowSnackbar({
          open: false,
          message: "",
          severity: undefined,
        });
      }, 6000);
    };
    resetState();
  }, [showSnackbar.open]);

  const validateLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const credentials = {
        username: username,
        password: password,
      };
      const { token, user_id } = await authenticate(credentials);

      if (token && user_id) {
        const userInfo = UserInfo.getInstance();
        userInfo.setAccessToken(token);
        userInfo.setUserId(user_id.toString());

        const newToken = userInfo.getAccessToken();
        if (newToken) {
          const { name, case_office, email } = await getUser(user_id);
          userInfo.setName(name);
          userInfo.setCaseOffice(case_office);
          userInfo.setEmail(email);

         
            const dataCaseOffices = await getCaseOffices();
            const dataCaseTypes = await getCaseTypes();
            setContextOffices(dataCaseOffices);
            setContextCaseTypes(dataCaseTypes);         
         
          history.push("/clients");
        }
      } else {
        setLoginError(true);
        setShowSnackbar({
          open: true,
          message: "Login failed",
          severity: "error",
        });
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      setShowSnackbar({
        open: true,
        message: "Login failed",
        severity: "error",
      });
    }
  };

  return (
    <LayoutSimple>
      <br />
      {loginError ? (
        <Typography component="p" style={{ color: "#990000", marginTop: 8 }}>
          {i18n.t("Login error")}
        </Typography>
      ) : null}

      <Box
        component="form"
        onSubmit={(event: React.SyntheticEvent) => {
          event.preventDefault();
          setLoginError(false);
          const target = event.target as typeof event.target & {
            email: { value: string };
            password: { value: string };
          };
          validateLogin(target.email.value, target.password.value);
        }}
        style={{ marginTop: 1 }}
      >
        <Grid container direction="row" spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel
                className={classes.inputLabel}
                htmlFor="email"
                shrink={true}
              >
                {i18n.t("Email address")}:
              </InputLabel>
              <Input
                id="email"
                disableUnderline={true}
                className={classes.textField}
                aria-describedby="my-helper-text"
                autoComplete="email"
                autoFocus
                required
              />
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel
                className={classes.inputLabel}
                htmlFor="password"
                shrink={true}
              >
                {i18n.t("Password")}:
              </InputLabel>
              <Input
                id="password"
                type="password"
                disableUnderline={true}
                className={classes.textField}
                aria-describedby="my-helper-text"
                autoComplete="password"
                required
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} style={{ position: "relative" }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              style={{ marginTop: 3, marginBottom: 2 }}
              disabled={isLoading}
            >
              {i18n.t("Login")}
              {isLoading && (
                <CircularProgress
                  size={24}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-12px",
                    marginLeft: "-12px",
                  }}
                />
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
      {showSnackbar.open && (
        <SnackbarAlert
          open={showSnackbar.open}
          message={showSnackbar.message ? showSnackbar.message : ""}
          severity={showSnackbar.severity}
        />
      )}
    </LayoutSimple>
  );
};

export default Page;
