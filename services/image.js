"use strict";

app.factory("$image", ["$q", "$timeout", function ($q, $timeout) {
    function ImageService() {
        
    };

    ImageService.prototype.create = function(src) {
        
        var deferred = $q.defer();
        var image = new Image();
        image.onloadprogress = function(e) {
            var value = e.loaded / e.total;
            deferred.notify(value);
        };
        image.onload = function () {
            deferred.resolve(image);
        };
        image.src = src;
        return deferred.promise;
    };
    
    ImageService.prototype.createFromDataUri = function(dataUri) {
        return $timeout(function() {
            var image = new Image();
            image.src = dataUri;
            return image;
        });
    };

    ImageService.prototype.toDataURL = function(src) {
        return this.create(src).then(angular.bind(this, function(image) {
            return this.imageToDataURL(image);
        }));
    };

    ImageService.prototype.imageToDataURL = function(image) {
        return $timeout(function () {
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);
            return canvas.toDataURL("image/png");
        });
    };

    return new ImageService();
} ]);