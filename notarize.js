require("dotenv").config();
const { notarize } = require("@electron/notarize");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  if (!process.env.APPLEID || !process.env.APPLEIDPASS || !process.env.TEAMID) {
    console.log(
      "Skipping notarization; set APPLEID, APPLEIDPASS, and TEAMID to notarize.",
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: "org.upscayl.Upscayl",
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    teamId: process.env.TEAMID,
  });
};
