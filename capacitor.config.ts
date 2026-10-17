
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "com.hieulv03.boom",
    appName: "Boom",
    webDir: "www",
    server: {
        url: "https://YOUR-BOOM-WEBSITE-URL",
        cleartext: false,
    },
    plugins: {
        Fullscreen: {
            activateOnLoad: false,
        },
    },
};

export default config;
