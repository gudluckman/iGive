import { alertNotifier } from "../components/Notifier/ActionNotifier";

export async function deleteAutomark(
  token: string,
  courseCode: string,
  task: string,
  id: string
) {
  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ zid: id, course_code: courseCode, task }),
  };

  return await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/api/task/delete_automark`,
    payload
  ).then((response) => {
    if (!response.ok) {
      alertNotifier(`HTTP error! Status: ${response.status}`);
      return false;
    }
    return true;
  });
}
