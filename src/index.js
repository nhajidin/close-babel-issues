import GitHubApi from "github";
import _ from "lodash";

import auth from "../auth.json";

const github = new GitHubApi({
  protocol: "https",
  Promise,
  timeout: 5000,
});

github.authenticate({
  type: "oauth",
  token: auth.token,
});


const repo = {
  owner: "babel",
  repo: "babel",
};

const closedIssues = [];

function processPulls(pulls) {
  _.forEach(pulls, (pull) => {
    if (!pull.body) {
      return;
    }

    // eslint-disable-next-line max-len
    const regex = /Fixed tickets[\s]*\|[\s]*(?:https:\/\/github\.com\/babel\/babel\/issues\/(\d+)|(#\d+(?:\s*,\s*#\d+)*))/;
    const issues = pull.body.match(regex);
    if (issues <= 1) {
      return;
    }

    console.log(`Processing PR${pull.number}`);

    if (!pull.merged_at) {
      console.log("The pull request was not merged.");
      return;
    }

    // single issue
    if (issues[1]) {
      processIssue(issues[1]);
      return;
    }

    // multiple issues
    issues[2].replace(/\s|#/g, "")
      .split(",")
      .forEach(processIssue);
  });
}

async function processIssue(number) {
  console.log(`Processing issue #${number}`);
  if (closedIssues.includes(number)) {
    console.log("Issue was already processed.");
    return;
  }

  closedIssues.push(number);

  const issueParam = { ...repo, number };

  let issue;
  try {
    issue = await github.issues.get(issueParam);
    if (!issue) {
      console.log("Couldn't retrieve issue.");
      return;
    }
  } catch (err) {
    console.log(`Couldn't retrieve issue #${number}: ${err}`);
  }

  if (issue.state === "closed") {
    console.log(`Issue #${number} is already closed.`);
    return;
  }

  try {
    // close issue
    await github.issues.edit({ ...issueParam, state: "closed" });
  } catch (err) {
    console.log(`Error closing issue: ${err}`);
  }
}

async function pager(res) {
  let pulls = res;

  processPulls(pulls);

  while (github.hasNextPage(pulls)) {
    pulls = await github.getNextPage(pulls);
    if (!pulls) {
      break;
    }

    processPulls(pulls);
  }
}

github.pullRequests
  .getAll({
    ...repo,
    state: "closed",
    per_page: 99,
  })
  .then(pager)
  .catch((err) => console.log("Error: ", err));
