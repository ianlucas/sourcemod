# @ianlucas/sourcemod

```bash
npm install @ianlucas/sourcemod -g
```

## Usage

- `sourcemod update <platform>` - updates or downloads the latest version of SourceMod
- `sourcemod install` - install all the dependencies in your project
- `sourcemod build <platform> [file]` - compiles plugins from the scripting folder

### Defining dependencies

To create a list of dependencies for your project, create a `sourcemod.txt` file in the root directory of your project. Each dependency should be listed on a separate line, like this:

```
json
ptah
```

> **Note**
> Dependencies should be located in the `./src/packages` directory. These are scripts that facilitate the download of dependency files and simplify the process of starting new projects.
