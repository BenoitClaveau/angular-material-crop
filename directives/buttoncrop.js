"use strict";

app.directive('crop', ['CropService', function(CropService) {
    return {
        restrict: 'EA',
        scope: {
            image: "=?",
            ratio: "=?",
            width: "=?",
            maxWidth: "=?",
            select: "&?"
        },
        template: '<canvas class="crop"></canvas>',
        link: function(scope, iElement, iAttrs) {
            
            var canvas = iElement.find("canvas");
            var options = {
                ratio: scope.ratio,
                width: scope.width,
                maxWidth: scope.maxWidth,
                image: scope.image
            };

            var cropService = new CropService(canvas[0], options);

            scope.$on('crop', function () {
                var out = cropService.crop();
                if (scope.select) scope.select({ "$image": out });
            });

            scope.$on('rotateRight', function () {
                cropService.rotateRight();
            });
            
            scope.$on('rotateLeft', function () {
                cropService.rotateLeft();
            });

            scope.$on('$destroy', function () {
                cropService.dispose();
            });
        }
    };
} ]);

app.directive('fileInput', ["$parse", function ($parse) {
    return {
        restrict: "EA",
        template: "<input type='file' accept='image/jpeg,image/png,image/gif,image/bmp;capture=camera' class='hidden'/>",
        replace: true,
        link: function(scope, element, attrs) {

            var modelGet = $parse("file");
            var modelSet = modelGet.assign;
            var onChange = $parse(attrs.onChange);
            
            var updateModel = function () {
                scope.$apply(function () {
                    var el = element[0];
                    modelSet(scope, el.files[0]);
                    el.value = null; //clear input
                    onChange(scope);
                });
            };

            element.on("change", updateModel);
        }
    };
} ]);

app.directive('buttonCrop', ["$mdDialog", "$timeout", "$compile", "FileReader", "$image", "$exception2", "$mdMedia", "DataError", "$rootScope", "$mdUtil", function ($mdDialog, $timeout, $compile, fileReader, $image, $exception2, $mdMedia, DataError, $rootScope, $mdUtil) {

    return {
        restrict: 'EA',
        scope: {
            out: "=?",
            ratio: "=?",
            width: "=?",
            maxWidth: "=?",
            progress: "=?",
            onSelect: "&?",
            onRead: "&?"
        },
        link: function(scope, element, attrs, ctrl) {
            var el = $compile('<file-input on-change="readFile($event)"></file-input>')(scope);
            angular.element(element).append(el);
                
            element.on("click", function ($event) {
                $event.stopPropagation();
                $event.preventDefault();
                scope.progress = 0;

                var event = new MouseEvent("click", { 
                    "view": window, 
                    "bubbles": false, 
                    "cancelable": false 
                });
                el[0].dispatchEvent(event);
            });

            scope.readFile = function ($event) {
                fileReader.readAsDataUrl(scope.file, scope).then(function(result) {
                    if (scope.onRead) {
                        return scope.onRead({$buffer: result});
                    }
                    else {
                        return $image.create(result).then(function(image) {
                            scope.open(image, $event);
                        }).catch(function(error) {
                            $exception2.show(error); 
                        });
                    }
                });
            };

            scope.$on("fileProgress", function(e, progress) {
                scope.$apply(function () {
                    scope.progress = (progress.loaded / progress.total) * 100;
                    //console.log("fileProgress", scope.progress);
                });
            });

            scope.open = function(image, $event) {
                var height = scope.width / scope.ratio;
                
                if (image.width < scope.width) {
                    if (image.height < height) throw new DataError({ data: { title: "Votre image est trop petite. ", message: "Le taille minimale est de " + scope.width + " pixels de largeur sur "+ height + " pixels de hauteur." }});
                }
                
                if (image.height < scope.width) {
                    if (image.width < height) throw new DataError({ data: { title: "Votre image est trop petite. ", message: "La taille minimale est de " + scope.width + " pixels de largeur sur "+ height + " pixels de hauteur." }});
                }
                
                $mdDialog.show({
                    templateUrl: '/pro/partials/dialog/crop.html',
                    controller: "CropDialogController",
                    controllerAs: "ctrl",
                    parent: angular.element(document.body),
                    locals: {
                        image: image,
                        ratio: scope.ratio,
                        width: scope.width,
                        maxWidth: scope.maxWidth
                    },
                    targetEvent: $event
                }).then(function(result) {
                    scope.out = result;
                    $mdUtil.enableScrolling();
                    if (scope.onSelect) scope.onSelect({"$image": result });
                }, function () {
                    $mdUtil.enableScrolling();
                    scope.out = scope.image;
                });
            };
        }
    };
} ]);

app.controller("CropDialogController", ["$scope", "$mdDialog", "image", "ratio", "width", "maxWidth", function ($scope, $mdDialog, image, ratio, width, maxWidth) {
    this.image = image;
    this.ratio = ratio;
    this.width = width;
    this.maxWidth = maxWidth;

    this.rotateRight = function () {
        $scope.$broadcast('rotateRight');
    };
    this.rotateLeft = function () {
        $scope.$broadcast('rotateLeft');
    };

    this.cancel = function () {
        $mdDialog.cancel();
    };

    this.cropped = function(image) {
        $mdDialog.hide(image);
    };

    this.answer = function(answer) {
        $scope.$broadcast('crop');
    };
} ]);