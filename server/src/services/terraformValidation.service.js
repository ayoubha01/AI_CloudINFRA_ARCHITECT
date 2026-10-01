import {
  mkdtemp,
  writeFile,
  readFile,
  rm
} from "fs/promises";

import path from "path";
import os from "os";

import {
  execFile
} from "child_process";

import {
  promisify
} from "util";

const execFileAsync = promisify(execFile);

export const validateTerraformCode =
  async (terraformCode) => {

    const tempDirectory =
      await mkdtemp(
        path.join(
          os.tmpdir(),
          "ai-iac-"
        )
      );

    const terraformFile =
      path.join(
        tempDirectory,
        "main.tf"
      );

    try {

      /*
      |--------------------------------------------------------------------------
      | 1. Write Terraform
      |--------------------------------------------------------------------------
      */

      await writeFile(
        terraformFile,
        terraformCode,
        "utf8"
      );

      /*
      |--------------------------------------------------------------------------
      | 2. terraform fmt
      |--------------------------------------------------------------------------
      */

      await execFileAsync(
        "terraform",
        [
          "fmt",
          "main.tf"
        ],
        {
          cwd: tempDirectory
        }
      );

      /*
      |--------------------------------------------------------------------------
      | 3. terraform init
      |--------------------------------------------------------------------------
      */

      await execFileAsync(
        "terraform",
        [
          "init",
          "-backend=false",
          "-input=false",
          "-no-color"
        ],
        {
          cwd: tempDirectory
        }
      );

      /*
      |--------------------------------------------------------------------------
      | 4. terraform validate
      |--------------------------------------------------------------------------
      */

      const {
        stdout
      } = await execFileAsync(
        "terraform",
        [
          "validate",
          "-json"
        ],
        {
          cwd: tempDirectory
        }
      );

      const validation =
        JSON.parse(stdout);

      /*
      |--------------------------------------------------------------------------
      | 5. Read formatted Terraform
      |--------------------------------------------------------------------------
      */

      const formattedTerraform =
        await readFile(
          terraformFile,
          "utf8"
        );

      return {
        valid: validation.valid,
        terraform: formattedTerraform,
        diagnostics:
          validation.diagnostics || []
      };

    } catch (error) {

      return {
        valid: false,

        terraform:
          terraformCode,

        error:
          error.stderr ||
          error.stdout ||
          error.message
      };

    } finally {

      /*
      |--------------------------------------------------------------------------
      | Cleanup temporary directory
      |--------------------------------------------------------------------------
      */

      await rm(
        tempDirectory,
        {
          recursive: true,
          force: true
        }
      );
    }
  };