const { defineConfig } = require("cypress");

module.exports = defineConfig({
        projectId: "6im7v7",
        video: false,
        e2e: {
                baseUrl: "http://localhost:11822",
                specPattern: "cypress/integration/**/*.js",
                supportFile: "cypress/support/index.js",
                setupNodeEvents(on, config) {
                        return require("./cypress/plugins/index.js")(on, config);
                },
        },
});
