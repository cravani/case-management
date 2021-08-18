import React, { useEffect } from "react";
import i18n from "../../i18n";
import Typography from "@material-ui/core/Typography";
import { Breadcrumbs, Container, Button, Grid, Select, InputLabel, MenuItem, Input, InputAdornment, IconButton } from "@material-ui/core";
import FolderIcon from "@material-ui/icons/Folder";
import CreateNewFolderIcon from "@material-ui/icons/CreateNewFolder";

import Layout from "../../components/layout";
import { getLegalCases } from "../../api";
import { ILegalCase } from "../../types";
import { useStyles } from "../../utils";
import { RedirectIfNotLoggedIn } from "../../auth";

import LegalCasesTable from "../../components/legalCase/table";
import { useHistory } from "react-router-dom";
import SearchIcon from "@material-ui/icons/Search";

const Page = () => {
  RedirectIfNotLoggedIn();
  const history = useHistory();
  const classes = useStyles();
  const [legalCases, setLegalCases] = React.useState<ILegalCase[]>();

  useEffect(() => {
    async function fetchData() {
      const dataLegalCases = await getLegalCases();
      setLegalCases(dataLegalCases);
    }
    fetchData();
  }, []);

  return (
    <Layout>
      <Breadcrumbs className={classes.breadcrumbs} aria-label="breadcrumb">
        <div>{i18n.t("Case list")}</div>
      </Breadcrumbs>

      <Container maxWidth="md">
        <Grid
          className={classes.pageBar}
          container
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <Grid item>
            <FolderIcon color="primary" style={{ display: "flex" }} />
          </Grid>
          <Grid item style={{ flexGrow: 1 }}>
            <Typography variant="h6">
              <strong>{i18n.t("Case list")}</strong>
            </Typography>
          </Grid>
          <Grid item className={classes.zeroWidthOnMobile}>
            <Button
              className={classes.canBeFab}
              color="primary"
              variant="contained"
              startIcon={<CreateNewFolderIcon />}
              onClick={() => {
                history.push(`/cases/new`);
              }}
            >
              {i18n.t("New case")}
            </Button>
          </Grid>
        </Grid>

        <Grid container direction="row" spacing={2} alignItems="center">
          <Grid item style={{ flexGrow: 1 }}>
            <strong>
              {legalCases ? legalCases.length : "0"} {i18n.t("Cases")}
            </strong>
          </Grid>
          <Grid item>
            <InputLabel
              className={classes.inputLabel}
              htmlFor="sort_table"
              shrink={true}
            >
              {i18n.t("Sort")}:
            </InputLabel>
          </Grid>
          <Grid item>
            <Select
              id="sort_table"
              className={classes.select}
              disableUnderline
              input={<Input />}
              value="alphabetical"
            >
              <MenuItem key="alphabetical" value="alphabetical">
                {i18n.t("Alphabetical")}
              </MenuItem>
            </Select>
          </Grid>
          <Grid item md={12} style={{ display: "none" }}>
            <Input
              id="table_search"
              fullWidth
              placeholder={i18n.t("Enter a name, case number, phone number...")}
              startAdornment={
                <InputAdornment position="start">
                  <IconButton>
                    <SearchIcon color="primary" />
                  </IconButton>
                </InputAdornment>
              }
              disableUnderline={true}
              className={classes.textField}
              aria-describedby="my-helper-text"
            />
          </Grid>
        </Grid>

        <LegalCasesTable legalCases={legalCases} />
      </Container>
    </Layout>
  );
};

export default Page;
