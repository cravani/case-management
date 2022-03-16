import React, { useEffect, useState } from "react";
import { useStyles } from "../../utils";
import i18n from "../../i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { format } from "date-fns";
import { ILegalCaseFile } from "../../types";
import {
  AudioFileIcon,
  ImageFileIcon,
  PdfFileIcon,
  FileIcon,
  VideoFileIcon,
} from "../general/icons";
import { BlackTooltip } from "../general/tooltip";
import userDefaultAvatar from "../../user-default-avatar.jpeg";

type Props = {
  caseUpdates: any;
  legalCaseFiles: ILegalCaseFile[];
};

const UpdateTable = (props: Props) => {
  const classes = useStyles();
  const [caseUpdates, setCaseUpdates] = useState<any>([]);
  const [legalCaseFiles, setLegalCaseFiles] = useState<ILegalCaseFile[]>([]);
  const [desktop, setDesktop] = useState<boolean>(false);

  useEffect(() => {
    setCaseUpdates(props.caseUpdates);
    setLegalCaseFiles(props.legalCaseFiles);
  }, [props.caseUpdates, props.legalCaseFiles]);

  useEffect(() => {
    window.innerWidth > 820 ? setDesktop(true) : setDesktop(false);

    const mql = window.matchMedia("(max-width: 820px)");
    mql.addEventListener("change", (e) => {
      const mobileView = e.matches;
      if (mobileView) {
        setDesktop(false);
      } else {
        setDesktop(true);
      }
    });
  }, []);

  const validFileIcon = (
    file_extension: string | undefined,
    filePath: string
  ) => {
    switch (file_extension) {
      case "pdf":
        return (
          <a href={filePath} target="_blank" rel="noreferrer">
            <PdfFileIcon />
          </a>
        );
      case "png":
      case "jpg":
      case "jpeg":
        return (
          <a href={filePath} target="_blank" rel="noreferrer">
            <ImageFileIcon />
          </a>
        );
      case "mp3":
      case "wav":
      case "m4a":
        return (
          <a href={filePath} target="_blank" rel="noreferrer">
            <AudioFileIcon />
          </a>
        );
      case "mp4":
      case "3gp":
        return (
          <a href={filePath} target="_blank" rel="noreferrer">
            <VideoFileIcon />
          </a>
        );
      default:
        return (
          <a href={filePath} target="_blank" rel="noreferrer">
            <FileIcon />
          </a>
        );
    }
  };

  return (
    <TableContainer>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow className={classes.tableHeadRow}>
            <TableCell className={classes.tableHeadCell}>
              {i18n.t("Type")}
            </TableCell>
            <TableCell
              className={classes.tableHeadCell}
              style={desktop ? { width: "450px" } : {}}
            >
              {i18n.t("Title")}
            </TableCell>
            <TableCell className={classes.tableHeadCell} align="center">
              {i18n.t("Files")}
            </TableCell>
            <TableCell className={classes.tableHeadCell} align="center">
              {i18n.t("User")}
            </TableCell>
            <TableCell className={classes.tableHeadCell} align="center">
              {i18n.t("Date")}
            </TableCell>
          </TableRow>
        </TableHead>

        {caseUpdates && caseUpdates.length > 0 ? (
          <TableBody>
            {caseUpdates
              ?.slice(0)
              .reverse()
              .map((update: any) => (
                <TableRow
                  key={update.id}
                  className={classes.caseHistoryList}
                  onClick={() => {}}
                >
                  <TableCell
                    className={classes.updateTableBodyCell}
                    align="center"
                  >
                    <Chip
                      label={
                        update.files > 0
                          ? "Upload"
                          : update.meeting !== null
                          ? "Meeting"
                          : update.note !== null
                          ? "Note"
                          : ""
                      }
                      className={classes.chip}
                    />
                  </TableCell>

                  <TableCell className={classes.updateTableBodyCell}>
                    <Typography>
                      {update.files > 0
                        ? "File uploaded " +
                          legalCaseFiles
                            ?.filter(
                              (caseFile: ILegalCaseFile) =>
                                update.files.indexOf(caseFile.id) > -1
                            )
                            .map(
                              (caseFile: ILegalCaseFile) => caseFile.description
                            )
                            .join(", ")
                        : update.meeting !== null
                        ? update.meeting.meeting_type + " with client"
                        : update.note !== null
                        ? update.note.content > 70 || !desktop
                          ? update.note.content.slice(0, 68) + "..."
                          : update.note.content
                        : ""}
                    </Typography>
                  </TableCell>

                  <TableCell
                    className={classes.updateTableBodyCell}
                    align="center"
                  >
                    {update.files > 0 ? (
                      legalCaseFiles
                        ?.filter(
                          (caseFile: ILegalCaseFile) =>
                            update.files.indexOf(caseFile.id) > -1
                        )
                        .map((caseFile: ILegalCaseFile) =>
                          validFileIcon(
                            caseFile.upload_file_extension,
                            caseFile.upload
                          )
                        )
                    ) : update.meeting !== null && update.meeting.file > 0 ? (
                      legalCaseFiles
                        ?.filter(
                          (caseFile: ILegalCaseFile) =>
                            [update.meeting.file].indexOf(caseFile.id) > -1
                        )
                        .map((caseFile: ILegalCaseFile) =>
                          validFileIcon(
                            caseFile.upload_file_extension,
                            caseFile.upload
                          )
                        )
                    ) : update.note !== null && update.note.file > 0 ? (
                      legalCaseFiles
                        ?.filter(
                          (caseFile: ILegalCaseFile) =>
                            [update.note.file].indexOf(caseFile.id) > -1
                        )
                        .map((caseFile: ILegalCaseFile) =>
                          validFileIcon(
                            caseFile.upload_file_extension,
                            caseFile.upload
                          )
                        )
                    ) : (
                      <Typography variant="caption">
                        {i18n.t("None")}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell
                    className={classes.updateTableBodyCell}
                    align="center"
                  >
                    <BlackTooltip title="created_by: null" arrow placement="top">
                      <img
                        className={classes.updateAvatar}
                        src={userDefaultAvatar}
                        alt={"user"}
                        loading={"lazy"}
                      />
                    </BlackTooltip>
                  </TableCell>

                  <TableCell
                    className={classes.updateTableBodyCell}
                    align="center"
                  >
                    <Typography variant="caption">
                      {format(new Date(update.created_at), "MMM dd, yyyy")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        ) : (
          <TableBody>
            <TableRow
              className={`${classes.tableBodyRow} ${classes.tableBodyRowEmpty}`}
            >
              <TableCell className={classes.tableBodyCell}></TableCell>
              <TableCell className={classes.tableBodyCell}></TableCell>
              <TableCell className={classes.tableBodyCell}></TableCell>
              <TableCell className={classes.tableBodyCell}></TableCell>
              <TableCell className={classes.tableBodyCell}></TableCell>
            </TableRow>
          </TableBody>
        )}
      </Table>
    </TableContainer>
  );
};
export default UpdateTable;
