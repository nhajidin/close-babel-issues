import GitHubApi from "github";
import _ from "lodash";

const github = new GitHubApi({
  protocol: "https",
  Promise,
  timeout: 5000,
});

function pager(pulls) {
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

    console.log(` Match: ${issues[0]}`);

    // single issue
    if (issues[1]) {
      console.log(` ${issues[1]}`);
      return;
    }

    // multiple issues
    issues[2].replace(/\s|#/g, "")
      .split(",")
      .forEach((issue) => console.log(` ${issue}`));
  });

  if (github.hasNextPage(pulls)) {
    return github.getNextPage(pulls)
      .then(pager);
  }

  return Promise.resolve();
}

github.pullRequests
  .getAll({
    owner: "babel",
    repo: "babel",
    state: "closed",
    per_page: 99,
  })
  .then(pager)
  .catch((err) => console.log("Error: ", err));
