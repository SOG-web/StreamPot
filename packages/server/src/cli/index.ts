import { Command } from "commander";
import { config } from "dotenv";
import { createServeCommand } from "./commands/serve";
import { createMigrateDownCommand } from "./commands/migrate-down";
import { createMigrateCommand } from "./commands/migrate";

export default new Command()
    .name("streampot")
    .description("CLI for the StreamPot server")
    .option("-e, --env <env>", "Environment file", ".env")
    .hook('preAction', (thisCommand) => {
        config({ path: thisCommand.opts().env });

        const requiredVars = ['DATABASE_URL'];
        const storageDriver = process.env.STORAGE_DRIVER ?? 's3';

        if (storageDriver === 's3') {
            requiredVars.push('S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_ENDPOINT', 'S3_PUBLIC_DOMAIN', 'S3_BUCKET_NAME', 'S3_REGION');
        } else if (storageDriver === 'local') {
            // no specific vars required for local, defaults are provided in storage.ts
        }

        ensureEnvVariablesExist(requiredVars);
    })
    .addCommand(createServeCommand())
    .addCommand(createMigrateDownCommand())
    .addCommand(createMigrateCommand());

function ensureEnvVariablesExist(names: string[]) {
    names.forEach(name => {
        if (!process.env[name]) {
            throw new Error(`Missing required environment variable ${name}`);
        }
    });
}
