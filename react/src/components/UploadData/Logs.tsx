import React, { useEffect, useState } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Log {
  log_message: string;
  created_at: string;
}

export default function FolderList() {
  //
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const urlPrefix =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://jbaaam-yl5rojgcbq-et.a.run.app";
    fetch(`${urlPrefix}/logs.json`)
      .then((response) => response.json())
      .then((data) =>
        setLogs(
          data.sort((a: { log_message: string }, b: { log_message: string }) =>
            a.log_message.localeCompare(b.log_message)
          )
        )
      );
  }, []);
  console.log(logs);
  return (
    <List sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
      {logs.map((log, index) => (
        <ListItem>
          <ListItemText
            primary={log.log_message}
            secondary={dayjs(log.created_at)
              .tz("Asia/Singapore")
              .format("YYYY-MM-DD HH:mm:ss")}
          />
        </ListItem>
      ))}
    </List>
  );
}
