# @ianlucas/sourcemod

```bash
npm install @ianlucas/sourcemod -g
```

## Usage

- `sourcemod update <platform>` - updates or downloads the latest version of SourceMod
- `sourcemod install` - install all the dependencies in your project
- `sourcemod build <platform> [file]` - compiles plugins from the scripting folder

### Defining dependencies

Create a `sourcemod.txt` file in the root of your project. Place every dependency in a line, like this:

```
json
ptah
```

> **Note**
> Dependencies must exist in `./src/packages` folder. Those are basically scripts for downloading the dependency files and making it easy to kick off new projects.
