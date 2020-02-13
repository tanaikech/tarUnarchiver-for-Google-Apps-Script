tarUnarchiver-for-Google-Apps-Script
=====
<a name="top"></a>

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENCE)

<a name="overview"></a>
# Overview
**This is a script for extracting files from a tar file using Google Apps Script.** This script was created by native Google Apps Script.

The following 3 situations gave me the motivarion for creating this script.

1. Although I had been looking for the script for extracting files from a tar file from before, I have still not been able to find it.
2. Unfortunately, there are no methods for extracting the files from the tar file in Google Apps Script. But fortunately, from [wiki of tar](https://en.wikipedia.org/wiki/Tar_(computing)), I could retrieve the structure information of the tar data. And I can also study by creating this script.
3. I found [this thread](https://stackoverflow.com/questions/54850028/how-to-extract-files-from-tar-archive-with-google-apps-script) at Stackoverflow. By this, I could understand that other users also want the script for extracting files from the tar file.

So I created this.


# IMPORTANT
In my environment, at February 7, 2020, finally, the V8 Runtime has been added to Google Apps Script. By this, the process cost is reduced.

For a tar file including 5 text files that each size is 1 MB, the following reduction can be seen.

| V8 | Process time [s] |
|:--| --: |
| With | 8 |
| Without | 35 |

# Usage
Please copy and paste the following script to your script editor. And please give a blob of tar data to the function of ``tarUnarchiver(blob)``. By this, the files in the tar file are extracted.

This script doesn't use some scopes. So users are not required to authorize the scopes. But when the file is read and created, the scope is used.

# Script
~~~javascript
// This function is the script for extracting files from a tar data.
function tarUnarchiver(blob) {
  var mimeType = blob.getContentType();
  if (!mimeType || !~mimeType.indexOf("application/x-tar")) {
    throw new Error("Inputted blob is not mimeType of tar. mimeType of inputted blob is " + mimeType);
  }
  var baseChunkSize = 512;
  var byte = blob.getBytes();
  var res = [];
  do {
    var headers = [];
    do {
      var chunk = byte.splice(0, baseChunkSize);
      var headerStruct = {
        filePath: function(b) {
          var r = [];
          for (var i = b.length - 1; i >= 0; i--) {
            if (b[i] != 0) {
              r = b.slice(0, i + 1);
              break;
            }
          }
          return r;
        }(chunk.slice(0, 100)),
        fileSize: chunk.slice(124, 124 + 11),
        fileType: Utilities.newBlob(chunk.slice(156, 156 + 1)).getDataAsString(),
      };
      Object.keys(headerStruct).forEach(function(e) {
        var t = Utilities.newBlob(headerStruct[e]).getDataAsString();
        if (e == "fileSize") t = parseInt(t, 8);
        headerStruct[e] = t;
      });
      headers.push(headerStruct);
    } while (headerStruct.fileType == "5");
    var lastHeader = headers[headers.length - 1];
    var filePath = lastHeader.filePath.split("/");
    var blob = Utilities.newBlob(byte.splice(0, lastHeader.fileSize)).setName(filePath[filePath.length - 1]).setContentTypeFromExtension();
    byte.splice(0, Math.ceil(lastHeader.fileSize / baseChunkSize) * baseChunkSize - lastHeader.fileSize);
    res.push({fileInf: lastHeader, file: blob});
  } while (byte[0] != 0);
  return res;
}

// Following function is a sample script for using tarUnarchiver().
// Please modify this to your situation.
function run() {
  // When you want to extract the files from .tar.gz file, please use the following script.
  var id = "### file ID of .tar.gz file ###";
  var gz = DriveApp.getFileById(id).getBlob().setContentTypeFromExtension();
  var blob = Utilities.ungzip(gz).setContentTypeFromExtension();

  // When you want to extract the files from .tar file, please use the following script.
  var id = "### file ID of .tar file ###";
  var blob = DriveApp.getFileById(id).getBlob().setContentType("application/x-tar");

  // Extract files from a tar data.
  var res = tarUnarchiver(blob);

  // If you want to create the extracted files to Google Drive, please use the following script.
  res.forEach(function(e) {
    DriveApp.createFile(e.file);
  });

  // You can see the file information by below script.
  Logger.log(res);
}
~~~

## IMPORTANT POINT:
- **When you run this script, if an error related to mimeType occurs, please set the mimeType of "tar" to the input blob.**
    - As the method for setting the mimeType, you can use as follows.
        - ``blob.setContentTypeFromExtension()``  [Ref](https://developers.google.com/apps-script/reference/base/blob#setContentTypeFromExtension())
        - ``blob.setContentType("application/x-tar")``  [Ref](https://developers.google.com/apps-script/reference/base/blob#setcontenttypecontenttype)
    - It might have already been got the mimeType in the blob. At that time, ``setContentTypeFromExtension()`` and ``setContentType()`` are not required.
- If you want to retrieve the file path of each file, please check the response from ``tarUnarchiver()``. You can see it as a property of ``fileInf`` from the response.

## LIMITATIONS:
When this script is used, there is the limitations as follows. These limitations are due to Google's specification.

- About the file size, when the size of tar data is over 50 MB (52,428,800 bytes), an error related to size limitation occurs.
- When the size of extracted file is over 50 MB, an error occurs.
- When a single file size of extracted file is near to 50 MB, there is a case that an error occurs.
    - In my environment, I could confirm that the size of 49 MB can be extracted. But in the case of just 50 MB
, an error occurred.


# Appendix
When I was creating this script, when the file for extracting becomes large, the memory limitation error often occurred. For example, even when the size is about 25 MB, the error occurred. So I was required to design the script for saving the memory. So the completed script became like above.

-----

<a name="Licence"></a>
# Licence
[MIT](LICENCE)

<a name="Author"></a>
# Author
[Tanaike](https://tanaikech.github.io/about/)

If you have any questions and commissions for me, feel free to contact me.

<a name="Update_History"></a>
# Update History
* v1.0.0 (February 27, 2019)

    1. Initial release.


[TOP](#top)
