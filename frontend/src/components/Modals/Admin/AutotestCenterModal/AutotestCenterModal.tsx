import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  Checkbox,
  InputAdornment,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { auth } from "../../../../util/firebase_util";
import { alertNotifier, successNotifier } from "../../../Notifier/ActionNotifier";
import { FileUploadButton } from "./FileUploadButton";
import { AutotestSummaryContainer } from "./AutotestSummaryContainer";
import { AutotestCenterModalProps } from "../../../../interfaces/modal.interface";

export function AutotestCenterModal({
  courseCode,
  task,
  handleAutotestCenterClose,
  autotestCenterOpen,
}: AutotestCenterModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* Closes the autotest center modal */
  const handleClose = () => {
    setEditingModule(null);
    resetFields();
    handleAutotestCenterClose();
  };

  /* Autotest Center Mode - Manual OR File */
  const [isManual, setIsManual] = useState(true);
  const toggleDialog = () => {
    resetFields();
    setIsManual((prevState) => !prevState);
  };

  /* Reset All Form Fields to Default State */
  const resetFields = () => {
    setTestName("");
    setTestRunnerArgs("");
    setTestTimeLimit("1");
    setTestMemLimit("50");
    setHiddenChecked(false);

    setAutotestInput("");
    setAutotestOutput("");

    setInFile(null);
    setOutFile(null);
  };

  /////////* MODAL STATE VARIABLES */////////

  /* Script Files Upload */
  // Note: not affected by reset_fields
  const [scriptFile, setScriptFile] = useState<null | File>(null);
  const [isScriptUploaded, setIsScriptUploaded] = useState(false);
  const scriptFileRef = useRef<HTMLInputElement>(null);

  /* Common Inputs */
  const [testName, setTestName] = useState("");
  const [testRunnerArgs, setTestRunnerArgs] = useState("");
  const [testTimeLimit, setTestTimeLimit] = useState("1");
  const [testMemLimit, setTestMemLimit] = useState("50");
  const [hiddenChecked, setHiddenChecked] = useState(false);

  /* Manual Inputs */
  const [autotestInput, setAutotestInput] = useState("");
  const [autotestOutput, setAutotestOutput] = useState("");

  /* File Upload Inputs */
  const [inFile, setInFile] = useState<null | File>(null);
  const [outFile, setOutFile] = useState<null | File>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const outputFileRef = useRef<HTMLInputElement>(null);

  /* Toggles the state of the hidden checkbox */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHiddenChecked(event.target.checked);
  };

  /* Links button to input element and opens file explorer */
  const handleFileUploadClick = (method: string) => {
    if (method === "in") {
      inputFileRef.current?.click();
    } else if (method === "out") {
      outputFileRef.current?.click();
    } else if (method === "script") {
      scriptFileRef.current?.click();
    }
  };

  /* State variable change upon file upload */
  const handleFileUploadChange = (
    event: ChangeEvent<HTMLInputElement>,
    method: string
  ) => {
    if (event.target.files) {
      const file = event.target.files[0];

      if (method === "in") {
        setInFile(file);
      } else if (method === "out") {
        setOutFile(file);
      } else if (method === "script") {
        setScriptFile(file);
        setIsScriptUploaded(false);
      }
    }
  };

  // Convert tildes to spaces consistently
  const normalizedTaskName = task.replaceAll(/~/g, " ");

  /* Handle Script File Upload */
  useEffect(() => {
    if (!isScriptUploaded && scriptFile) {
      auth.currentUser?.getIdToken().then((token) => {
        const headers = { Authorization: "Bearer " + token };

        const formDataHidden = new FormData();
        formDataHidden.append("hidden", "true");
        formDataHidden.append("course_code", courseCode || "");
        formDataHidden.append("task", normalizedTaskName);
        formDataHidden.append("script", scriptFile || "");

        const hiddenScriptFetch = fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/task/upload_script`,
          {
            method: "POST",
            body: formDataHidden,
            headers: headers,
          }
        );

        const formDataSample = new FormData();
        formDataSample.append("hidden", "false");
        formDataSample.append("course_code", courseCode || "");
        formDataSample.append("task", normalizedTaskName);
        formDataSample.append("script", scriptFile || "");

        const sampleScriptFetch = fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/task/upload_script`,
          {
            method: "POST",
            body: formDataSample,
            headers: headers,
          }
        );

        Promise.all([hiddenScriptFetch, sampleScriptFetch])
          .then((responses) => {
            const [hiddenScriptRes, sampleScriptRes] = responses;

            if (!hiddenScriptRes.ok) {
              return hiddenScriptRes.json().then((errData) => {
                throw new Error(errData.error);
              });
            }
            if (!sampleScriptRes.ok) {
              return sampleScriptRes.json().then((errData) => {
                throw new Error(errData.error);
              });
            }

            return Promise.all([
              hiddenScriptRes.json(),
              sampleScriptRes.json(),
            ]);
          })
          .then((data) => {
            const [hiddenScriptData, sampleScriptData] = data;
            setIsScriptUploaded(true);
            successNotifier(
              "Success: " + hiddenScriptData["message"] + " (automark)"
            );
            successNotifier(
              "Success: " + sampleScriptData["message"] + " (autotest)"
            );
          })
          .catch((error) => alertNotifier("Error: " + error));
      });
    }
  }, [scriptFile, isScriptUploaded, courseCode, normalizedTaskName]);

  /* Handle Script File Download */
  const handleScriptDownload = () => {
    if (!scriptFile) {
      alertNotifier("No script file to be downloaded.");
      return;
    }

    const fileURL = URL.createObjectURL(scriptFile);
    const link = document.createElement("a");
    link.href = fileURL;

    // filename of downloaded file will always be
    // courseCode_taskName_run.sh
    link.download = courseCode + "_" + task + "_run.sh";
    link.click();

    // clean up the object URL after download is initiated
    URL.revokeObjectURL(fileURL);
  };

  /* Handle Autotest Adding from Manual Creation */
  const handleManualAdd = () => {
    if (!testName.trim()) {
      alertNotifier("Test needs a name.");
      return;
    } else if (!Number(testTimeLimit)) {
      alertNotifier("Time limit should be a number.");
      return;
    } else if (Number(testTimeLimit) <= 0) {
      alertNotifier("Time limit should be greater than 0 seconds.");
      return;
    } else if (!Number(testMemLimit)) {
      alertNotifier("Memory limit should be a number.");
      return;
    } else if (Number(testMemLimit) <= 0) {
      alertNotifier("Memory limit should be greater than 0 megabytes.");
      return;
    }

    const formData = new FormData();
    formData.append("input", autotestInput);
    formData.append("output", autotestOutput);
    const hidden = hiddenChecked ? "true" : "false";
    formData.append("hidden", hidden);
    formData.append("course_code", courseCode || "");
    formData.append("task", task.replaceAll(/~/g, " ") || "");
    formData.append("test_name", testName);

    formData.append("runner_args", testRunnerArgs);
    formData.append("cpu_time", testTimeLimit);
    formData.append("memory_megabytes", testMemLimit);

    auth.currentUser?.getIdToken().then((token) => {
      fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/task/add_autotest_from_string`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            return response.json().then((errData) => {
              throw new Error(errData.error);
            });
          }
          return response.json();
        })
        .then((data) => {
          successNotifier(data.message);
          if (hiddenChecked) {
            setHiddenTests([testName, ...hiddenTests]);
          } else {
            setSampleTests([testName, ...sampleTests]);
          }
          resetFields();
        })
        .catch((error) => alertNotifier("Error adding test: " + error));
    });
  };

  /* Handle Autotest Adding from File Upload */
  const handleFileAdd = () => {
    if (!testName.trim()) {
      alertNotifier("Test needs a name.");
      return;
    } else if (!Number(testTimeLimit)) {
      alertNotifier("Time limit should be a number.");
      return;
    } else if (Number(testTimeLimit) <= 0) {
      alertNotifier("Time limit should be greater than 0 seconds.");
      return;
    } else if (!Number(testMemLimit)) {
      alertNotifier("Memory limit should be a number.");
      return;
    } else if (Number(testMemLimit) <= 0) {
      alertNotifier("Memory limit should be greater than 0 megabytes.");
      return;
    }

    const formData = new FormData();
    formData.append("input", inFile || "");
    formData.append("output", outFile || "");
    const hidden = hiddenChecked ? "true" : "false";
    formData.append("hidden", hidden);
    formData.append("course_code", courseCode || "");
    formData.append("task", normalizedTaskName);
    formData.append("test_name", testName);

    formData.append("runner_args", testRunnerArgs);
    formData.append("cpu_time", testTimeLimit);
    formData.append("memory_megabytes", testMemLimit);

    auth.currentUser?.getIdToken().then((token) => {
      fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/task/add_autotest_from_file`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            return response.json().then((errData) => {
              throw new Error(errData.error);
            });
          }
          return response.json();
        })
        .then((data) => {
          successNotifier(data.message);
          if (hiddenChecked) {
            setHiddenTests([testName, ...hiddenTests]);
          } else {
            setSampleTests([testName, ...sampleTests]);
          }
          resetFields();
        })
        .catch((error) => alertNotifier("Error adding test: " + error));
    });
  };

  // Deleting an autotest
  const handleAutotestDeleteClick = (
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) => {
    const testName = e.currentTarget.id;
    const isHidden = e.currentTarget.getAttribute("data-ishidden");

    auth.currentUser?.getIdToken().then(token => {
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/task/delete_test/${courseCode}/${task.replaceAll(/~/g, " ")}/${isHidden}/${testName}`, {
        method: "DELETE",
        headers: {
          'Authorization': 'Bearer ' + token
        }
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((errData) => {
              throw new Error(errData.error);
            })
          }
        })
        .then(() => {
          if (isHidden === "true") {
            setHiddenTests((names) =>
              names.filter((name) => name !== testName)
            );
          } else {
            setSampleTests((names) =>
              names.filter((name) => name !== testName)
            );
          }
          setEditingModule(null);
          resetFields();
        })
        .catch((error) => alertNotifier("Error deleting test: " + error));
    });
  };

  // State variable for editing
  // empty if no test staged for editing - name of test if staged for editing
  const [editingModule, setEditingModule] = useState<string | null>(null);

  // Upon clicking an autotest in the summary, loads data of the autotest into
  // the creation form and allows for live editing
  const handleAutotestEditClick = (
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) => {
    const testName = e.currentTarget.id;
    const isHidden = e.currentTarget.getAttribute("data-ishidden");

    const editing = testName + isHidden!;
    setEditingModule(editing);
    setIsManual(true);
  };

  // EDITING
  useEffect(() => {
    if (editingModule) {
      // extracting testName and isHidden from editingModule
      let testName: string;
      let isHidden: string;
      const boolPart = editingModule.substring(editingModule.length - 4);
      if (boolPart === "true") {
        testName = editingModule.substring(0, editingModule.length - 4);
        isHidden = "true";
      } else {
        testName = editingModule.substring(0, editingModule.length - 5);
        isHidden = "false";
      }

      auth.currentUser?.getIdToken().then(token => {
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/task/get_test/${courseCode}/${task.replaceAll(/~/g, " ")}/${testName}/${isHidden}`, {
          method: "GET",
          headers: {
            'Authorization': 'Bearer ' + token
          }
        })
          .then((response) => {
            if (!response.ok) {
              return response.json().then((errData) => {
                throw new Error(errData.error);
              });
            }
            return response.json();
          })
          .then((data) => {
            setTestName(data["test_name"]);
            setAutotestInput(data["input"]);
            setAutotestOutput(data["output"]);
            setTestRunnerArgs(data["runner_args"]);
            setTestTimeLimit(data["cpu_time"]);
            setTestMemLimit(data["memory_megabytes"]);
            setHiddenChecked(data["isHidden"]);
          })
          .catch((error) => alertNotifier("Error loading test: " + error));
      });
    }
  }, [courseCode, task, editingModule]);

  // Sending the new form data to backend to update existing test folder
  const handleEditConfirm = () => {
    if (!testName.trim()) {
      alertNotifier("Error editing test: Test needs a name.");
      return;
    } else if (!Number(testTimeLimit)) {
      alertNotifier("Error editing test: Time limit should be a number.");
      return;
    } else if (Number(testTimeLimit) <= 0) {
      alertNotifier("Error editing test: Time limit should be greater than 0 seconds.");
      return;
    } else if (!Number(testMemLimit)) {
      alertNotifier("Error editing test: Memory limit should be a number.");
      return;
    } else if (Number(testMemLimit) <= 0) {
      alertNotifier("Error editing test: Memory limit should be greater than 0 megabytes.");
      return;
    }

    // this should NOT ever need to happen - sanity check
    if (!editingModule) {
      alertNotifier("FATAL: no test staged for editing. Aborting...");
      return;
    }

    // extracting the old test name and isHidden from editingModule
    let oldTestName: string;
    let oldIsHidden: string;
    const boolPart = editingModule.substring(editingModule.length - 4);
    if (boolPart === "true") {
      oldTestName = editingModule.substring(0, editingModule.length - 4);
      oldIsHidden = "true";
    } else {
      oldTestName = editingModule.substring(0, editingModule.length - 5);
      oldIsHidden = "false";
    }

    // note: the following data injected into the form are NEW and
    // are grabbed from the form after the confirm button has been
    // clicked
    const formData = new FormData();
    formData.append("input", autotestInput);
    formData.append("output", autotestOutput);
    const hidden = hiddenChecked ? "true" : "false";
    formData.append("hidden", hidden);
    formData.append("test_name", testName);

    formData.append("runner_args", testRunnerArgs);
    formData.append("cpu_time", testTimeLimit);
    formData.append("memory_megabytes", testMemLimit);

    auth.currentUser?.getIdToken().then(token => {
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/task/edit_test/${courseCode}/${task.replaceAll(/~/g, " ")}/${oldTestName}/${oldIsHidden}`, {
        method: "PUT",
        body: formData,
        headers: {
          'Authorization': 'Bearer ' + token
        }
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((errData) => {
              throw new Error(errData.error);
            });
          }
          return response.json();
        })
        .then((data) => {
          // edit the autotest summary to reflect new (if changed) test name
          // will not change the position of the test name unless changing
          // test visibility

          // at this point, we should not need to handle cases where the old test name
          // does not exist in the test list as it is checked by the api request
          let index: number;
          if (oldIsHidden === "true" && hiddenChecked) {
            // both old and new are hidden tests
            index = hiddenTests.indexOf(oldTestName);
            hiddenTests[index] = testName;
          } else if (oldIsHidden === "false" && !hiddenChecked) {
            // both old and new are sample tests
            index = sampleTests.indexOf(oldTestName);
            sampleTests[index] = testName;
          } else if (oldIsHidden === "true" && !hiddenChecked) {
            // old is hidden, new is sample
            setHiddenTests((names) =>
              names.filter((name) => name !== oldTestName)
            );
            setSampleTests((names) => [testName, ...names]);
          } else if (oldIsHidden === "false" && hiddenChecked) {
            // old is sample, new is hidden
            setSampleTests((names) =>
              names.filter((name) => name !== oldTestName)
            );
            setHiddenTests((names) => [testName, ...names]);
          }

          // alert user that edit is successful
          successNotifier("Success: " + data["message"]);

          // unstage the test to be edited
          setEditingModule(null);

          // reset form fields
          resetFields();
        })
        .catch((error) => alertNotifier("Error editing test: " + error.message));
    });
  };

  const handleEditCancel = () => {
    setEditingModule(null);
    resetFields();
  };

  /* Autotest Summary Data Loading */
  const [hiddenTests, setHiddenTests] = useState<string[]>([]);
  const [sampleTests, setSampleTests] = useState<string[]>([]);

  /* Loading Created Autotests into the Autotest Summary + Script File (if uploaded) */
  // should only trigger once upon task details page load
  useEffect(() => {
    if (!auth.currentUser) {
      return; // Exit early if no user is authenticated
    }

    let isMounted = true; // Add mounted check to prevent state updates after unmount

    const loadData = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers = {'Authorization': 'Bearer ' + token };

        // Load script file
        try {
          const scriptResponse = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/api/task/get_script/${courseCode}/${normalizedTaskName}`,
            {
              method: "GET",
              headers: headers,
            }
          );

          if (!scriptResponse.ok) {
            if (scriptResponse.status === 404) {
              console.log("Script file does not exist, skipping...");
            } else {
              const errData = await scriptResponse.json();
              throw new Error(errData.error);
            }
          } else {
            const blob = await scriptResponse.blob();
            if (blob && isMounted) {
              const file = new File([blob], "run.sh", {
                type: "application/x-sh",
              });
              setIsScriptUploaded(true);
              setScriptFile(file);
            }
          }
        } catch (error) {
          if (isMounted) {
            alertNotifier(`Error loading script: ${error}`);
          }
        }

        // Load test names
        try {
          const [hiddenRes, sampleRes] = await Promise.all([
            fetch(`${process.env.REACT_APP_BACKEND_URL}/api/task/get_test_names/${courseCode}/${normalizedTaskName}/true`, {
              method: "GET",
              headers: headers,
            }),
            fetch(`${process.env.REACT_APP_BACKEND_URL}/api/task/get_test_names/${courseCode}/${normalizedTaskName}/false`, {
              method: "GET",
              headers: headers,
            })
          ]);

          if (!hiddenRes.ok || !sampleRes.ok) {
            throw new Error("Could not fetch test data");
          }

          const [hiddenData, sampleData] = await Promise.all([
            hiddenRes.json(),
            sampleRes.json(),
          ]);

          if (isMounted) {
            setHiddenTests(hiddenData["names"]);
            setSampleTests(sampleData["names"]);
          }
        } catch (error) {
          if (isMounted) {
            alertNotifier(`Error loading tests: ${error}`);
          }
        }
      } catch (error) {
        if (isMounted) {
          alertNotifier(`Error: ${error}`);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false; // Cleanup to prevent state updates after unmount
    };
  }, [courseCode, normalizedTaskName]);

  return (
    <>
      {/* Autotest Center Modal */}
      <Dialog
        open={autotestCenterOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#F4F3F8",
            borderRadius: "10px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 600,
            fontSize: "1.25rem",
            bgcolor: "#2C3C5F",
            height: "30px",
            color: "white",
          }}
        >
          Autotest Center
          <IconButton onClick={handleClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box
            display="flex"
            flexDirection={isMobile ? "column" : "row"}
            justifyContent="space-between"
            mt="20px"
            gap={isMobile ? "20px" : 0}
          >
            {/* Left Column */}
            <Box width={isMobile ? "100%" : "47%"}>
              <DialogContentText sx={{ marginBottom: "11px" }}>
                Please upload the required script file to run autotests.
              </DialogContentText>
              <Box sx={{ bgcolor: "white", borderRadius: "8px" }}>
                {/* Script File Input */}
                <FileUploadButton
                  handleFileUploadClick={handleFileUploadClick}
                  handleFileUploadChange={handleFileUploadChange}
                  handleScriptDownload={handleScriptDownload}
                  fileRef={scriptFileRef}
                  file={scriptFile}
                  method={"script"}
                  uploaded={isScriptUploaded}
                />
              </Box>

              {/* Creation / Editing Box */}
              <Box
                sx={{
                  bgcolor: "white",
                  borderRadius: "20px",
                  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
                  mt: "28px",
                }}
              >
                {/* Header Box */}
                <Box
                  display="flex"
                  sx={{
                    bgcolor: "#ccdafc",
                    borderTopLeftRadius: "20px",
                    borderTopRightRadius: "20px",
                    px: "20px",
                    py: "15px",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: "18px", mb: "10px" }}>
                      {editingModule ? "Autotest Editing" : "Autotest Creation"}
                    </Typography>
                    <Typography sx={{ fontSize: "12px" }}>
                      {editingModule
                        ? "Please fill in the form to edit your tests."
                        : "Please fill in the form to create your tests."
                      }
                    </Typography>
                  </Box>
                  <Tooltip
                    title={
                      isManual
                        ? "Swap to File Upload"
                        : "Swap to Manual Creation"
                    }
                  >
                    <IconButton
                      sx={{ maxHeight: "34px", ml: "auto" }}
                      disabled={Boolean(editingModule)}
                      onClick={toggleDialog}
                      id={"swap"}
                    >
                      <SwapHorizIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Box for Form Inputs */}
                <Box
                  sx={{
                    px: "20px",
                    py: "15px",
                  }}
                >
                  {/* Test Name Input */}
                  <TextField
                    fullWidth
                    label="Test Name"
                    value={testName}
                    variant="outlined"
                    onChange={(e) => setTestName(e.target.value)}
                    sx={{ mb: "10px" }}
                  />
                  {isManual ? (
                    <>
                      <TextField
                        fullWidth
                        multiline
                        label="Input"
                        value={autotestInput}
                        variant="outlined"
                        onChange={(e) => setAutotestInput(e.target.value)}
                        sx={{ mb: "10px" }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        label="Output"
                        value={autotestOutput}
                        variant="outlined"
                        onChange={(e) => setAutotestOutput(e.target.value)}
                        sx={{ mb: "10px" }}
                      />
                    </>
                  ) : (
                    <>
                      {/* Input File Upload Button */}
                      <FileUploadButton
                        handleFileUploadClick={handleFileUploadClick}
                        handleFileUploadChange={handleFileUploadChange}
                        fileRef={inputFileRef}
                        file={inFile}
                        method={"in"}
                        uploaded={true}
                      />

                      {/* Output File Upload Button */}
                      <FileUploadButton
                        handleFileUploadClick={handleFileUploadClick}
                        handleFileUploadChange={handleFileUploadChange}
                        fileRef={outputFileRef}
                        file={outFile}
                        method={"out"}
                        uploaded={true}
                      />
                    </>
                  )}

                  {/* Runner Args Input */}
                  <TextField
                    fullWidth
                    label="Runner Args"
                    value={testRunnerArgs}
                    variant="outlined"
                    onChange={(e) => setTestRunnerArgs(e.target.value)}
                    sx={{ mb: "10px" }}
                  />

                  <Box display="flex" justifyContent="space-between">
                    {/* Time Limit Input */}
                    <TextField
                      label="Time Limit"
                      value={testTimeLimit}
                      variant="outlined"
                      type="number"
                      onChange={(e) => setTestTimeLimit(e.target.value)}
                      sx={{ width: "47%", mb: "10px" }}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">s</InputAdornment>
                          ),
                        },
                      }}
                    />

                    {/* Memory Limit Input */}
                    <TextField
                      label="Memory Limit"
                      value={testMemLimit}
                      variant="outlined"
                      type="number"
                      onChange={(e) => setTestMemLimit(e.target.value)}
                      sx={{ width: "47%", mb: "10px" }}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">MB</InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>

                  {/* Hidden Toggle + Add Button */}
                  <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="space-between"
                    gap="10px"
                  >
                    <Box display="flex" flexDirection="row">
                      <DialogContentText
                        sx={{ textAlign: "center", mt: "10px" }}
                      >
                        Hidden:{" "}
                      </DialogContentText>
                      <Checkbox
                        checked={hiddenChecked}
                        onChange={handleChange}
                      />
                    </Box>

                    {editingModule ? (
                      // Cancel + Confirm for Editing
                      <Box display="flex" gap="10px">
                        <Button
                          variant="outlined"
                          onClick={handleEditCancel}
                          sx={{
                            fontWeight: 600,
                            color: "#1a73e8",
                            width: "100px",
                            maxHeight: "46px",
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleEditConfirm}
                          sx={{
                            fontWeight: 600,
                            color: "#1a73e8",
                            width: "100px",
                            maxHeight: "46px",
                          }}
                        >
                          Confirm
                        </Button>
                      </Box>
                    ) : (
                      // Add for Creation
                      <Button
                        variant="outlined"
                        onClick={isManual ? handleManualAdd : handleFileAdd}
                        sx={{
                          fontWeight: 600,
                          color: "#1a73e8",
                          width: "100px",
                          maxHeight: "46px",
                        }}
                      >
                        Add
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Right Column */}
            <Box width={isMobile ? "100%" : "47%"}>
              {/* Autotest Summary Scrollables */}
              <Box
                sx={{
                  bgcolor: "white",
                  borderRadius: "20px",
                  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
                  mt: isMobile ? "0" : "5px"
                }}
              >
                {/* Autotest Summary Title */}
                <Box
                  display="flex"
                  sx={{
                    bgcolor: "#ccdafc",
                    borderTopLeftRadius: "20px",
                    borderTopRightRadius: "20px",
                    px: "20px",
                    py: "15px",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: "18px", mb: "10px" }}>
                      Autotest Summary
                    </Typography>
                    <Typography sx={{ fontSize: "12px" }}>
                      List of currently created autotests. Click on a test to
                      edit.
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ px: "20px", py: "15px" }}>
                  {/* Hidden Test Summary */}
                  <Typography
                    sx={{ fontWeight: 600, fontSize: "16px", mb: "5px" }}
                  >
                    Hidden Tests - Automark
                  </Typography>
                  <AutotestSummaryContainer
                    tests={hiddenTests}
                    handleAutotestDeleteClick={handleAutotestDeleteClick}
                    handleAutotestEditClick={handleAutotestEditClick}
                    editingModule={editingModule}
                    hidden={true}
                  />
                  {/* Sample Test Summary */}
                  <Typography
                    sx={{ fontWeight: 600, fontSize: "16px", mb: "5px" }}
                  >
                    Sample Tests - Autotest
                  </Typography>
                  <AutotestSummaryContainer
                    tests={sampleTests}
                    handleAutotestDeleteClick={handleAutotestDeleteClick}
                    handleAutotestEditClick={handleAutotestEditClick}
                    editingModule={editingModule}
                    hidden={false}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
