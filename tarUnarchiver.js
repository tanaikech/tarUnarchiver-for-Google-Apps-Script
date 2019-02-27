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
