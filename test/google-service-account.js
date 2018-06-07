if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const { google } = require("googleapis");

// var translate = require("@google-cloud/translate");

// var translateClient = translate({
//   projectId: process.env.GCLOUD_PROJECT,
//   keyFilename: `./${process.env.GOOGLE_APPLICATION_CREDENTIALS}`
// });

// translateClient
//   .detect("Hello")
//   .then(x => console.log(x))
//   .catch(e => console.log(e));

async function main() {
  // This method looks for the GCLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS
  // environment variables.
  const auth = await google.auth.getClient({
    // Scopes can be specified either as an array or as a single, space-delimited string.
    scopes: ["https://www.googleapis.com/auth/compute"]
  });

  // obtain the current project Id
  const project = await google.auth.getDefaultProjectId();
  const compute = google.compute({
    version: "v1"
  });
  // Fetch the list of GCE zones within a project.
  const res = await compute.zones.list({ project, auth });
  console.log(res.data);
}

main().catch(console.error);
