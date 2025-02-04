import React, { DragEvent, useState, useRef } from "react";
import { Box, Modal, Typography, Button } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useTheme } from "@mui/material/styles";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface FileDropAttributes {
  selectedSubcategory: string;
  selectedSource: string[];
}
export function FileDrop({
  selectedSubcategory,
  selectedSource,
}: FileDropAttributes) {
  const [isOver, setIsOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode[]>([]);
  const requiredCols: string[] = ["date", "feedback"];
  const theme = useTheme();

  const validateDateFormat = (dates: string[]) => {
    return dates.every((date) => {
      // ✅01/04/2024 09:00:00 AM in xls
      let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}(?:.*)?$/;
      if (!regex.test(date)) {
        // ✅01-04-24  09:00:00 AM in csv
        regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{2}(?:.*)?$/;
        console.log(date);
      }
      return regex.test(date);
    });
  };

  const convertExcelTimestampToDate = (timestamp: number): string => {
    // 45383
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(
      excelEpoch.getTime() + timestamp * 24 * 60 * 60 * 1000
    );
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    // 01-04-24
    const dateStr = `${day}-${month}-${year}`;
    return dateStr;
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Define the event handlers
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(false);

    // Fetch the files
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);

    if (selectedSubcategory === undefined || selectedSource[0] === undefined) {
      setModalContent([
        <Typography
          key="error"
          variant="h6"
          component="div"
          sx={{ fontWeight: "bold" }}
        >
          Error
        </Typography>,
        <Typography key="message" variant="body1" component="div">
          Please select a subcategory and source.
        </Typography>,
      ]);
      setOpenModal(true);
    } else {
      // Use FileReader to read file content
      droppedFiles.forEach((file) => {
        processFile(file);
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
      ? Array.from(event.target.files)
      : [];
    setFiles(uploadedFiles);
    if (selectedSubcategory === undefined || selectedSource[0] === undefined) {
      setModalContent([
        <Typography
          key="error"
          variant="h6"
          component="div"
          sx={{ fontWeight: "bold" }}
        >
          Error
        </Typography>,
        <Typography key="message" variant="body1" component="div">
          Please select a subcategory and source.
        </Typography>,
      ]);
      setOpenModal(true);
    } else {
      uploadedFiles.forEach((file) => {
        processFile(file);
      });
    }
  };

  const processFile = (file: File) => {
    const ext = file.name.match(/\.([^\.]+)$/);
    // if (ext && !["csv"].includes(ext[1]) && !/^xls/i.test(ext[1])) {
    if (ext && !["csv"].includes(ext[1])) {
      setModalContent([
        <Typography
          key="error"
          variant="h6"
          component="div"
          sx={{ fontWeight: "bold" }}
        >
          Error
        </Typography>,
        <Typography key="message" variant="body1" component="div">
          Invalid file format.
        </Typography>,
      ]);
      setOpenModal(true);
    } else {
      const reader = new FileReader();

      reader.onloadend = () => {
        // let isValid = false;
        let isValid = true;

        // if (ext && ext[1] === "csv") {
        //     const csvData = reader.result as string;
        //     const parsed = Papa.parse(csvData, {header: true});
        //     let columns: string[] = [];
        //     if (parsed.meta && parsed.meta.fields) {
        //         columns = parsed.meta.fields.map((col: string) =>
        //             col.trim().toLowerCase()
        //         );
        //         const columnsSet = new Set(columns);
        //         let dateColumnName =
        //             parsed.meta.fields.find(
        //                 (col: string) =>
        //                     col.trim().toLowerCase() === "date"
        //             ) || "";
        //         isValid =
        //             requiredCols.every((col) => columnsSet.has(col)) &&
        //             validateDateFormat(
        //                 parsed.data.map(
        //                     (obj: any) => obj[dateColumnName]
        //                 )
        //             );
        //     }

        //     if (!isValid) {
        //         setModalContent("Error: Invalid data.");
        //         setOpenModal(true);
        //         return;
        //     }
        // } else if (ext && ext[1].startsWith("xls")) {
        //     const data = new Uint8Array(reader.result as ArrayBuffer);
        //     const workbook = XLSX.read(data, {type: "array"});
        //     const firstSheetName = workbook.SheetNames[0];
        //     const worksheet = workbook.Sheets[firstSheetName];
        //     const sheetData = XLSX.utils.sheet_to_json(worksheet, {
        //         header: 1,
        //     });
        //     const columns = (sheetData[0] as string[]).map(
        //         (col: string) => col.trim().toLowerCase()
        //     );
        //     const columnsSet = new Set(columns);
        //     const transformedData = sheetData
        //         .slice(1)
        //         .map((row: any) => {
        //             // Produces Eg. {feedback: ..., date: ...}
        //             const obj: {[key: string]: string} = {};
        //             row.forEach((val: string, idx: number) => {
        //                 obj[columns[idx]] = val;
        //             });
        //             return obj;
        //         });
        //     let dateColumnName =
        //         columns.find(
        //             (col) => col.trim().toLowerCase() === "date"
        //         ) || "";
        //     isValid =
        //         requiredCols.every((col) => columnsSet.has(col)) &&
        //         validateDateFormat(
        //             transformedData.map((obj: any) =>
        //                 convertExcelTimestampToDate(obj[dateColumnName])
        //             )
        //         );

        //     if (!isValid) {
        //         setModalContent("Error: Invalid data.");
        //         setOpenModal(true);
        //         return;
        //     }
        // }

        if (isValid) {
          const newFilename =
            selectedSubcategory + "__" + selectedSource[0] + "__" + file.name;
          const newFile = new File([file], newFilename, {
            type: file.type,
          });

          console.log("Filename:", newFile);
          console.log("File:", file);
          console.log(reader);
          console.log(reader.result);

          // Create FormData and append the file
          const formData = new FormData();
          const csrfMetaTag = document.querySelector('meta[name="csrf-token"]');

          // Check if the csrfMetaTag is not null before accessing its attributes
          const csrfToken = csrfMetaTag
            ? csrfMetaTag.getAttribute("content")
            : "";

          formData.append("file", newFile);
          console.log("env", process.env.NODE_ENV);
          console.log("X-CSRF-Token", csrfToken);
          const urlPrefix =
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : "https://jbaaam-yl5rojgcbq-et.a.run.app";

          fetch(`${urlPrefix}/analytics/uploads`, {
            method: "POST",
            body: formData,
            headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("Network response was not ok");
              }
              return response.json(); // or response.text() if the response is not JSON
            })
            .then((data) => {
              console.log("Success:", data);
            })
            .catch((error) => {
              console.error("Error:", error);
            });
          setModalContent([]);
          setOpenModal(true);
        }
      };
      reader.onerror = () => {
        console.error("There was an issue reading the file.");
      };

      if (ext && ext[1] === "csv") {
        reader.readAsText(file);
      }
      // else if (ext && ext[1].startsWith("xls")) {
      //   reader.readAsArrayBuffer(file);
      // }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      data-testid="drop-zone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "600px",
        width: "100%",
        borderRadius: 18,
        backgroundColor: isOver
          ? "gray"
          : theme.palette.mode === "dark"
          ? "#222"
          : "#ccc",
        boxShadow: `inset 0 0 20px ${
          theme.palette.mode === "dark" ? "#333" : "#aaa"
        }`,
      }}
    >
      <input
        type="file"
        id="fileInput"
        style={{ display: "none" }}
        multiple
        onChange={handleFileSelect}
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <CloudUploadIcon sx={{ color: "darkgray", fontSize: "8rem" }} />
        <Typography sx={{ fontSize: "1.4rem" }}>
          Drag and drop CSV files here
        </Typography>
        <Typography sx={{ m: 3, fontSize: "1.2rem", fontWeight: "bold" }}>
          OR
        </Typography>
        <Button
          variant="contained"
          component="label"
          htmlFor="fileInput"
          onClick={handleButtonClick}
          sx={{
            borderRadius: 8,
            fontSize: "1.1rem",
            boxShadow: 0,
            backgroundColor: theme.palette.mode === "dark" ? "#C00" : "#E00",
            padding: "0.5rem 2rem",
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" ? "#A00" : "#C00",
              boxShadow: 0,
            },
          }}
        >
          Select Files
        </Button>
      </Box>
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-content"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            p: 2.5,
            bgcolor: "background.paper",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            position: "absolute",
            borderRadius: 3,
            boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography id="modal-title" variant="h6" component="h2">
            {modalContent.length > 0 ? (
              modalContent
            ) : (
              <>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontWeight: "bold" }}
                >
                  Uploaded successfully:
                </Typography>
                {files.map((file, index) => (
                  <React.Fragment key={index}>
                    <Typography variant="body1" component="div">
                      {selectedSubcategory +
                        "__" +
                        selectedSource[0] +
                        "__" +
                        file.name}
                    </Typography>
                  </React.Fragment>
                ))}
              </>
            )}
          </Typography>
          <Button
            onClick={handleCloseModal}
            sx={{
              mt: 1,
              backgroundColor: theme.palette.mode === "dark" ? "#222" : "#eee",
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
