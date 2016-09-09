# apng2webp

`apng2webp` converts [animated PNG](https://en.wikipedia.org/wiki/APNG)'s 
to animated [WebP](https://en.wikipedia.org/wiki/WebP).
 
## Demo

[https://davidmz.github.io/apng2webp/](https://davidmz.github.io/apng2webp/)
 
## Usage
`npm install apng2webp`
 
## API

Package exports one (default) function with signature:

```
apng2webp(apngData: ArrayBuffer): Promise.<Blob>
```
Usage:
```
import apng2webp from 'apng2webp';

apng2webp(apngData)
    .then(blob => {
        // work with WebP data in blob
    });
```

This package relies on browser canvas WebP encoder.