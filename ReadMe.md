# PDF Hot Reload

<p align="center">
    <img width="256" height="256" src="https://github.com/GageSorrell/PdfHotReload/blob/master/Logo.png?raw=true">
</p>

PDF Hot Reload is an `npm` package that enables users to view their work in the browser with automatic reloading.

This package is made for systems that do not readily support the common implementations of this behavior.
For example, the LaTeX Workshop plugin is currently broken when run on `code-server` on Android.

# Installation

PDF Hot Reload is available on `npm`,
```bash
npm i -g @sorrell/pdf-hot-reload
```

# Configuration

Currently, there exist no options to configure.

# Usage

Simply run `pdf-hot-reload myFile.tex`.
This will start the server and will open the web page in your default browser.
Because Android is the primary use-case for this package, `termux-open` is supported.

# Contributing

Pull requests are accepted, and Issues will be watched for.
Please do not hesitate to contact me with issues or requests.