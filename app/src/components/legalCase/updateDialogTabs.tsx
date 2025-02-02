import React, { useState, useRef, useEffect } from "react";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import {
  IconButton,
  Input,
  InputLabel,
  FormHelperText,
  Grid,
} from "@material-ui/core";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import UploadIcon from "@mui/icons-material/Upload";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import AttachmentIcon from "@mui/icons-material/Attachment";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import i18n from "../../i18n";
import { TabPanelProps, ILegalCaseFile } from "../../types";
import { useStyles } from "../../utils";
import { meetingTypes } from "../../contexts/meetingTypeConstants";
import Dropzone from "react-dropzone";
import ProgressBar from "../general/progressBar";
import { BlackTooltip } from "../general/tooltip";
import { TrashIcon } from "../general/icons";

type Props = {
  onFileChange?: (event: any, fileDescription: string) => Promise<void>;
  note: any;
  setNote: (note: any) => void;
  meeting: any;
  setMeeting: (meeting: any) => void;
  progress: number;
  onDrop: (files: any) => void;
  fileTabFileName: string;
  setFileTabFileName: (fileTabFileName: string) => void;
  selectedFiles: any;
  setSelectedFiles: (selectedFiles: any) => void;
  tabValue: number;
  setTabValue: (tabValue: number) => void;
  updateError: string;
  fileView?: boolean;
  editView?: boolean;
  updateFileId: number | null;
  legalCaseFiles: ILegalCaseFile[];
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <>{children}</>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    "aria-controls": `tabpanel-${index}`,
  };
}

const UpdateDialogTabs = (props: Props) => {
  const classes = useStyles();
  const [value, setValue] = useState<number>(props.fileView ? 2 : 0);
  const [open, setOpen] = useState<boolean>(false);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [fileDescription, setFileDescription] = useState<string>("");
  const [stagedFileName, setStagedFileName] = useState<string>("");
  const [showButtons, setShowButtons] = useState<boolean>(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    props.setTabValue(newValue);
    props.setFileTabFileName("");
    props.setSelectedFiles(undefined);
    props.setMeeting({
      meeting_type: "",
      location: "",
      notes: "",
      meeting_date: new Date().toISOString().slice(0, 16),
      advice_was_offered: "",
      advice_offered: "",
    });
    props.setNote({
      title: "",
      content: "",
    });
  };

  const dialogClose = () => {
    setOpen(false);
    setFileDescription("");
  };

  const showOpenFileDialog = () => {
    if (!uploadFileRef.current) throw Error("uploadFileRef is not assigned");
    uploadFileRef.current.click();
  };

  const validFileLink = (filePath: string, description: string) => {
    return (
      <a
        href={filePath}
        target="_blank"
        rel="noreferrer"
        className={classes.noOverflow}
      >
        {description}
      </a>
    );
  };

  useEffect(() => {
    function changeValue() {
      if (props.editView && props.tabValue === 0) {
        setValue(0);
      } else if (props.editView && props.tabValue === 1) {
        setValue(1);
      } else if (props.editView && props.tabValue === 2) {
        setValue(2);
      }
    }
    changeValue();
  }, [props.editView, props.tabValue]);

  return (
    <DialogContent style={{ padding: 0 }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="tab panels"
          classes={{ indicator: classes.noIndicator }}
        >
          <Tab
            key="caseInfo"
            className={classes.dialogTabButton}
            icon={
              <InsertDriveFileOutlinedIcon
                style={{ transform: "rotate(180deg)" }}
              />
            }
            label={<Typography>{i18n.t("Note")}</Typography>}
            {...a11yProps(0)}
            disabled={props.editView && value !== 0 ? true : false}
          />
          <Tab
            key="meetings"
            className={classes.dialogTabButton}
            icon={<ForumOutlinedIcon />}
            label={<Typography>{i18n.t("Meeting")}</Typography>}
            {...a11yProps(1)}
            disabled={props.editView && value !== 1 ? true : false}
          />
          <Tab
            key="caseFiles"
            className={classes.dialogTabButton}
            icon={<UploadIcon />}
            label={<Typography>{i18n.t("File upload")}</Typography>}
            {...a11yProps(2)}
            disabled={props.editView && value !== 2 ? true : false}
          />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Box className={classes.tabBox}>
          <Alert
            severity="info"
            className={classes.updateAlert}
            icon={<HelpOutlineOutlinedIcon fontSize="large" />}
          >
            {i18n.t(
              "A note is the quickest way for a case worker to update a case with new information and ensure that anybody working on case is able to keep informed about its progress. "
            )}
          </Alert>
          {props.updateError === "title" && (
            <FormHelperText error>
              {i18n.t("Enter a valid title")}
            </FormHelperText>
          )}
          <Input
            id="title"
            disableUnderline={true}
            fullWidth
            value={props.note.title}
            placeholder={i18n.t("Note title")}
            className={classes.dialogInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              props.setNote({ ...props.note, title: e.target.value });
            }}
          />
          {props.updateError === "content" && (
            <FormHelperText error>
              {i18n.t("Enter a valid description")}
            </FormHelperText>
          )}
          <Input
            id="content"
            disableUnderline={true}
            fullWidth
            value={props.note.content}
            rows={10}
            multiline
            placeholder={i18n.t("Description of update")}
            className={classes.dialogInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              props.setNote({ ...props.note, content: e.target.value });
            }}
          />
          {props.progress
            ? props.progress > 0 && (
                <Grid>
                  <ProgressBar progress={props.progress} />
                </Grid>
              )
            : null}
          <Box
            className={classes.centerItems}
            sx={{ justifyContent: "space-between", marginBottom: "25px" }}
          >
            <Button
              className={classes.attachmentButton}
              startIcon={<AttachmentIcon className={classes.attachmentIcon} />}
              onClick={() => setOpen(true)}
            >
              {i18n.t("Attach files to note")}
            </Button>
            {stagedFileName.length > 0 && (
              <FormHelperText id="file-selected">
                {i18n.t("New file")}:
                {stagedFileName.length > 24
                  ? stagedFileName.slice(0, 22) + "..."
                  : stagedFileName}
              </FormHelperText>
            )}
            {props.updateFileId !== null &&
              props.updateFileId > 0 &&
              props.editView &&
              stagedFileName.length === 0 &&
              props.legalCaseFiles
                ?.filter(
                  (caseFile: ILegalCaseFile) =>
                    [props.updateFileId].indexOf(caseFile.id as number) > -1
                )
                .map((caseFile: ILegalCaseFile) =>
                  validFileLink(caseFile.upload, caseFile.description as string)
                )}
            <Dialog open={open} onClose={dialogClose} fullWidth maxWidth="sm">
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  id="name"
                  label="File description"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={fileDescription}
                  onChange={(e: React.ChangeEvent<{ value: any }>) => {
                    setFileDescription(e.target.value);
                  }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={dialogClose}>Cancel</Button>
                <Button
                  color="primary"
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => {
                    showOpenFileDialog();
                    setOpen(false);
                  }}
                >
                  {i18n.t("Choose file")}
                </Button>
              </DialogActions>
            </Dialog>
            <input
              ref={uploadFileRef}
              type="file"
              hidden
              onChange={(event) => {
                if (props.onFileChange) {
                  props.onFileChange(event, fileDescription);
                }
                if (event.target.files) {
                  setStagedFileName(
                    fileDescription.length > 0
                      ? fileDescription
                      : event.target.files[0].name
                  );
                }
              }}
            />
            <Typography
              className={classes.dialogLabel}
              style={{ paddingLeft: "10px" }}
            >
              {i18n.t("Uploaded files will be added to the case file")}
            </Typography>
          </Box>
        </Box>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Box className={classes.tabBox}>
          <Alert
            severity="info"
            className={classes.updateAlert}
            icon={<HelpOutlineOutlinedIcon fontSize="large" />}
          >
            {i18n.t(
              "A meeting is a clear record that an engagement between client and case officer took place. "
            )}
          </Alert>
          {props.updateError === "meeting_type" && (
            <FormHelperText error>
              {i18n.t("Enter a valid meeting type")}
            </FormHelperText>
          )}
          <Box
            className={classes.centerItems}
            style={{
              marginBottom: "20px",
            }}
          >
            <InputLabel
              className={classes.dialogLabel}
              style={{ paddingRight: 15 }}
              htmlFor="meeting-type"
            >
              {i18n.t("Meeting type")}:
            </InputLabel>
            <Select
              id="meeting-type"
              className={classes.select}
              style={{ flexGrow: 1 }}
              disableUnderline
              input={<Input />}
              value={props.meeting.meeting_type}
              onChange={(e: SelectChangeEvent<string>) => {
                props.setMeeting({
                  ...props.meeting,
                  meeting_type: e.target.value,
                });
              }}
            >
              {meetingTypes?.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </Box>
          {props.updateError === "location" && (
            <FormHelperText error>
              {i18n.t("Enter a valid location")}
            </FormHelperText>
          )}
          <Input
            id="meeting-location"
            disableUnderline={true}
            fullWidth
            value={props.meeting.location}
            placeholder={i18n.t("Meeting location")}
            className={classes.dialogInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              props.setMeeting({
                ...props.meeting,
                location: e.target.value,
              });
            }}
          />
          {props.updateError === "notes" && (
            <FormHelperText error>
              {i18n.t("Enter a valid note")}
            </FormHelperText>
          )}
          <Input
            id="meeting-note"
            disableUnderline={true}
            value={props.meeting.notes}
            fullWidth
            rows={4}
            multiline
            placeholder={i18n.t("Notes from meeting")}
            className={classes.dialogInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              props.setMeeting({
                ...props.meeting,
                notes: e.target.value,
              });
            }}
          />
          <Box
            className={classes.centerItems}
            style={{
              marginBottom: "20px",
            }}
          >
            <InputLabel
              className={`${classes.dialogLabel} ${classes.dateLabel}`}
              htmlFor="Meeting-date"
            >
              {i18n.t("Meeting date")}
            </InputLabel>
            <Input
              fullWidth
              id="meeting_date"
              type="datetime-local"
              disableUnderline={true}
              className={classes.dialogInput}
              style={{ marginBottom: 0 }}
              classes={{ input: classes.dateInput }}
              aria-describedby="date-picker"
              value={
                props.meeting.meeting_date
                  ? props.meeting.meeting_date.slice(0, 16)
                  : new Date().toISOString().slice(0, 16)
              }
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                props.setMeeting({
                  ...props.meeting,
                  meeting_date: e.target.value,
                });
              }}
            />
          </Box>
          {props.updateError === "meeting_date" && (
            <FormHelperText error>
              {i18n.t("Enter a valid date")}
            </FormHelperText>
          )}
          <Box
            className={classes.centerItems}
            style={{
              marginBottom: "20px",
            }}
          >
            <InputLabel
              className={classes.dialogLabel}
              style={{ paddingRight: 15 }}
              htmlFor="was_advice_offered"
            >
              {i18n.t("Was advice offered")}?
            </InputLabel>
            <Select
              id="was_advice_offered"
              className={classes.select}
              style={{ flexGrow: 1 }}
              disableUnderline
              input={<Input />}
              value={props.meeting.advice_was_offered}
              onChange={(e: SelectChangeEvent<string>) => {
                props.setMeeting({
                  ...props.meeting,
                  advice_was_offered: e.target.value,
                });
              }}
            >
              <MenuItem key={"true"} value={"true"}>
                {i18n.t("Yes")}
              </MenuItem>
              <MenuItem key={"false"} value={"false"}>
                {i18n.t("No")}
              </MenuItem>
            </Select>
          </Box>
          <Input
            id="advice_offered"
            disableUnderline={true}
            fullWidth
            rows={4}
            multiline
            value={props.meeting.advice_offered}
            placeholder={i18n.t("Record of advice offered")}
            className={classes.dialogInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              props.setMeeting({
                ...props.meeting,
                advice_offered: e.target.value,
              });
            }}
          />
          {props.progress
            ? props.progress > 0 && (
                <Grid>
                  <ProgressBar progress={props.progress} />
                </Grid>
              )
            : null}
          <Box
            className={classes.centerItems}
            sx={{ justifyContent: "space-between", marginBottom: "25px" }}
          >
            <Button
              className={classes.attachmentButton}
              startIcon={<AttachmentIcon className={classes.attachmentIcon} />}
              onClick={() => setOpen(true)}
            >
              {i18n.t("Attach files to meeting")}
            </Button>
            {stagedFileName.length > 0 && (
              <FormHelperText id="file-selected">
                New file:{" "}
                {stagedFileName.length > 24
                  ? stagedFileName.slice(0, 22) + "..."
                  : stagedFileName}
              </FormHelperText>
            )}
            {props.updateFileId !== null &&
              props.updateFileId > 0 &&
              props.editView &&
              stagedFileName.length === 0 &&
              props.legalCaseFiles
                ?.filter(
                  (caseFile: ILegalCaseFile) =>
                    [props.updateFileId].indexOf(caseFile.id as number) > -1
                )
                .map((caseFile: ILegalCaseFile) =>
                  validFileLink(caseFile.upload, caseFile.description as string)
                )}
            <Dialog open={open} onClose={dialogClose} fullWidth maxWidth="sm">
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  id="name"
                  label="File description"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={fileDescription}
                  onChange={(e: React.ChangeEvent<{ value: any }>) => {
                    setFileDescription(e.target.value);
                  }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={dialogClose}>Cancel</Button>
                <Button
                  color="primary"
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => {
                    showOpenFileDialog();
                    setOpen(false);
                  }}
                >
                  {i18n.t("Choose file")}
                </Button>
              </DialogActions>
            </Dialog>
            <input
              ref={uploadFileRef}
              type="file"
              hidden
              onChange={(event) => {
                if (props.onFileChange) {
                  props.onFileChange(event, fileDescription);
                }
                if (event.target.files) {
                  setStagedFileName(
                    fileDescription.length > 0
                      ? fileDescription
                      : event.target.files[0].name
                  );
                }
              }}
            />
            <Typography
              className={classes.dialogLabel}
              style={{ paddingLeft: "10px" }}
            >
              {i18n.t("Uploaded files will be added to the case file")}
            </Typography>
          </Box>
        </Box>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Box className={classes.tabBox}>
          <Alert
            severity="info"
            className={classes.updateAlert}
            icon={<HelpOutlineOutlinedIcon fontSize="large" />}
          >
            {i18n.t(
              "Upload, label and add descriptions to important files to ensure that they are safely stored and always available to anyone else working on the case. "
            )}
          </Alert>
          {props.updateError === "file_upload" && (
            <FormHelperText error>
              {i18n.t("Upload a valid file")}
            </FormHelperText>
          )}

          {props.updateFileId !== null &&
          props.updateFileId > 0 &&
          props.editView ? (
            <Typography className={classes.noOverflow}>
              {props.legalCaseFiles
                ?.filter(
                  (caseFile: ILegalCaseFile) =>
                    [props.updateFileId].indexOf(caseFile.id as number) > -1
                )
                .map((caseFile: ILegalCaseFile) =>
                  validFileLink(caseFile.upload, caseFile.description as string)
                )}
            </Typography>
          ) : (
            <Dropzone onDrop={props.onDrop} multiple={false}>
              {({ getRootProps, getInputProps }) => (
                <div {...getRootProps({ className: classes.dropzone })}>
                  <input {...getInputProps()} />
                  {props.selectedFiles && props.fileTabFileName.length > 0 ? (
                    <Typography
                      className={classes.noOverflow}
                      style={{ width: "100%" }}
                    >
                      {i18n.t("Submit update to save file")}:{" "}
                      {props.fileTabFileName}
                    </Typography>
                  ) : (
                    <Stack
                      direction="column"
                      justifyContent="center"
                      alignItems="center"
                      spacing={1}
                    >
                      <FileUploadOutlinedIcon
                        style={{ fontSize: 36, color: "#b2b2b2" }}
                      />
                      <Typography className={classes.dropzoneText}>
                        {i18n.t("Drag and drop files here or")}
                      </Typography>
                      <Button className={classes.dropzoneButton}>
                        {i18n.t("click to add files from device")}
                      </Button>
                    </Stack>
                  )}
                </div>
              )}
            </Dropzone>
          )}
          {props.selectedFiles !== undefined && (
            <Box style={{ width: "100%" }}>
              <InputLabel
                className={classes.dialogLabel}
                style={{ marginBottom: "20px" }}
              >
                {i18n.t("Upload progress")}:
              </InputLabel>
              <Box className={classes.uploadProgressBox}>
                <Box style={{ flexGrow: 1 }}>
                  <Box
                    className={classes.centerItems}
                    style={{ justifyContent: "space-between" }}
                  >
                    <Input
                      id="title"
                      disableUnderline={true}
                      fullWidth
                      disabled={!showButtons}
                      placeholder={i18n.t("File name")}
                      value={props.fileTabFileName}
                      className={classes.dialogFileInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        props.setFileTabFileName(e.target.value);
                      }}
                    />
                    {showButtons ? (
                      <Box style={{ minWidth: 85 }}>
                        <BlackTooltip title="Cancel" arrow placement="top">
                          <IconButton
                            className={classes.renameIcons}
                            onClick={() => {
                              props.setFileTabFileName(
                                props.selectedFiles.name || ""
                              );
                              setShowButtons(false);
                            }}
                          >
                            <CancelIcon style={{ fontSize: 30 }} />
                          </IconButton>
                        </BlackTooltip>
                        <BlackTooltip
                          title="Save changes"
                          arrow
                          placement="top"
                        >
                          <IconButton
                            className={classes.renameIcons}
                            onClick={() => setShowButtons(false)}
                          >
                            <CheckCircleIcon style={{ fontSize: 30 }} />
                          </IconButton>
                        </BlackTooltip>
                      </Box>
                    ) : (
                      <Typography
                        className={classes.renameFile}
                        onClick={() => setShowButtons(true)}
                      >
                        {i18n.t("Rename file")}
                      </Typography>
                    )}
                  </Box>
                  {props.progress
                    ? props.progress > 0 && <ProgressBar progress={30} />
                    : null}
                </Box>
                <BlackTooltip title="Delete file" arrow placement="top">
                  <IconButton
                    className={classes.deleteIcon}
                    onClick={() => props.setSelectedFiles(undefined)}
                  >
                    <TrashIcon />
                  </IconButton>
                </BlackTooltip>
              </Box>
            </Box>
          )}
        </Box>
      </TabPanel>
    </DialogContent>
  );
};

export default UpdateDialogTabs;
