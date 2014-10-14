# pipeline-ui

This is a prototype for a UI for creating pipelines and viewing the output. Inspired by Open Refine and
IPython Notebook.

![screenshot](screen.png)

Example command: ```cat test.csv | csv-parser | jsonmap "this.fluffy = this.fluffy == 1 ? 'yes' : 'no'"```

## Ideas
- The tool runs in a webbrowser (or atom shell?)
- There is a field, where you can input the pipeline in UNIX style
  - e.g. curl random.org | parse | transform
- The output of the last command in the pipeline should be NDJSON or CSV, which then gets displayed in the UI table
- Run the whole pipeline, it might cache the results of the steps of the pipeline, so that you can re-run only parts from it
- It doesn't have to be UNIX styled pipelines for the user. Rather it should look like click, drag'n'drop and happiness
  - but under the hood it is Gasket / UNIX pipelines / datscript (?)
- Sources can be: Webpages, Files..
- It should be for sketching pipelines in a playful manner. Therefore it could use only a head of the source in the beginning
- Inspiration for the pipeline UI: http://gulpfiction.divshot.io/