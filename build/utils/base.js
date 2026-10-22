import { execa } from "execa";
import chalk from "chalk";
import { getGlobalBaseBranch } from "../config.js";
const REPO_BASE_KEY = "wt.basebranch";
export async function getRepoBaseBranch() {
    const { stdout, exitCode } = await execa("git", ["config", "--local", "--get", REPO_BASE_KEY], { reject: false });
    if (exitCode !== 0) {
        return undefined;
    }
    return stdout.trim() || undefined;
}
export async function setRepoBaseBranch(ref) {
    await execa("git", ["config", "--local", REPO_BASE_KEY, ref]);
}
export async function clearRepoBaseBranch() {
    await execa("git", ["config", "--local", "--unset", REPO_BASE_KEY], { reject: false });
}
export async function resolveBaseBranch(flagValue) {
    if (flagValue && flagValue.trim() !== "") {
        return { ref: flagValue.trim(), source: "flag" };
    }
    const repoBase = await getRepoBaseBranch();
    if (repoBase) {
        return { ref: repoBase, source: "repo" };
    }
    const globalBase = getGlobalBaseBranch();
    if (globalBase) {
        return { ref: globalBase, source: "global" };
    }
    return undefined;
}
export async function fetchBaseRef(ref) {
    const { stdout } = await execa("git", ["remote"]);
    const remotes = stdout.split("\n").map((name) => name.trim()).filter(Boolean);
    const remote = remotes.find((name) => ref.startsWith(`${name}/`));
    if (!remote) {
        return;
    }
    const branch = ref.slice(remote.length + 1);
    try {
        await execa("git", ["fetch", remote, branch]);
        console.log(chalk.gray(`Fetched ${remote}/${branch}.`));
    }
    catch {
        console.warn(chalk.yellow(`Could not fetch ${remote}/${branch}; using the local copy of ${ref}.`));
    }
}
