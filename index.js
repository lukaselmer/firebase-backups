require("dotenv").load();
const firebase = require("firebase-admin");
const fs = require("fs");

const serviceAccountFile = process.env.SERVICE_ACCOUNT_FILE;
if (!serviceAccountFile) {
  console.error("ENV variable SERVICE_ACCOUNT_FILE is not set, aborting");
  process.exit(1);
}
const serviceAccount = require(serviceAccountFile);
const exportFile = process.env.EXPORT_FILE || "out/export.json";

const projectId = serviceAccount["project_id"];
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: `https://${projectId}.firebaseio.com`
});

async function downloadAll() {
  return new Promise((resolve, reject) => {
    const db = firebase.database();
    const ref = db
      .ref("/")
      .once("value", snapshot => resolve(snapshot.val()))
      .catch(error => reject(error));
  });
}

function exitProgram() {
  console.log("backup successful");
  process.exit();
}

function abortProgram(error) {
  console.error(`error during backup`);
  console.error(error);
  process.exit();
}

function writeData(jsonText, destination) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync("out") && destination.startsWith("out")) fs.mkdirSync("out");
    fs.writeFile(destination, jsonText, err => (err ? reject(err) : resolve()));
  });
}

const backupExecution = (async () => {
  console.log("downloading data");
  const data = await downloadAll();
  console.log("done downloading");
  await writeData(JSON.stringify(data, null, 2), exportFile);
  console.log(`successfully written data to ${exportFile}`);
})();

backupExecution.then(() => exitProgram()).catch(error => abortProgram(error));
