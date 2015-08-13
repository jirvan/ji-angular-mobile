/*

 ji-angular-mobile-1.0.2.js

 Copyright (c) 2014,2015 Jirvan Pty Ltd
 All rights reserved.

 Redistribution and use in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 * Neither the name of Jirvan Pty Ltd nor the names of its contributors
 may be used to endorse or promote products derived from this software
 without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

(function () {
    //'use strict';

    angular.module('jiAngularMobile', [])

        //========== ji service ==========//
        .factory('ji', ['$filter', function ($filter) { return new JiService($filter); }])

        //========== logonDialog service etc ==========//
        //.factory('jiLogonDialog', function ($modal) { return new LogonDialogService($modal); })
        //.controller('LogonDialogController', LogonDialogController)

        //========== ResetPasswordDialog service etc ==========//
        //.factory('jiResetPasswordDialog', function ($modal) { return new ResetPasswordDialogService($modal); })
        //.controller('ResetPasswordDialogController', ResetPasswordDialogController)

        //========== ji-auto-focus ==========//
        .directive('jiAutoFocus', function ($timeout) {
                       return {
                           restrict: 'AC',
                           link: function (scope, element) {

                               // Set the standard attribute to disable the $modal hijacking of autofocus
                               element.attr("autofocus", true);

                               $timeout(function () {
                                   element[0].focus();
                               }, 0);

                           }
                       };
                   })

        //========== ji-scope-element ==========//
        .directive('jiScopeElement', function () {
                       return {
                           restrict: 'A',
                           link: function (scope, element, attr) {
                               scope[attr.jiScopeElement] = element;
                           }
                       };
                   })

        //========== ji-parent-scope-element ==========//
        .directive('jiParentScopeElement', function () {
                       return {
                           restrict: 'A',
                           link: function (scope, element, attr) {
                               scope.$parent[attr.jiParentScopeElement] = element;
                           }
                       };
                   })

        //========== ji-form ==========//
        .directive('jiForm', ['$timeout', function ($timeout) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {

                    var form, formName = element[0].getAttribute("name");
                    if (formName) {
                        form = scope[formName];
                        form.element = element;
                        form.touchAllInputs = touchAllInputs;
                        form.moveFocusToFirstInvalidInput = moveFocusToFirstInvalidInput;
                        form.validate = validate;
                        form.resetInputs = resetInputs;
                        $timeout(resetInputs, 0);

                        function resetInputs() {
                            form.inputs = [];
                            for (fieldName in form) {
                                if (fieldName[0] != '$' && form[fieldName] && (typeof form[fieldName].$pristine != 'undefined')) {
                                    var field = form[fieldName];
                                    var inputElements = element.find("input");
                                    for (var i = 0; i < inputElements.length; i++) {
                                        if (inputElements[i].getAttribute("name") === fieldName) {
                                            form.inputs.push(field);
                                            field.element = inputElements[i];
                                            inputElements[i].onfocus = function (event) {
                                                var targetName = event.target.getAttribute("name");
                                                if (targetName && scope[formName] && scope[formName][targetName]) {
                                                    $timeout(function () {scope.$eval(formName + "." + targetName + ".$jiHasFocus = true")}, 0);
                                                }
                                            };
                                            inputElements[i].onblur = function () {
                                                var targetName = event.target.getAttribute("name");
                                                if (targetName && scope[formName] && scope[formName][targetName]) {
                                                    $timeout(function () {scope.$eval(formName + "." + targetName + ".$jiHasFocus = false")}, 0);
                                                }
                                            };
                                        }
                                    }
                                }
                            }
                        }

                    } else {
                        throw new Error("ji-form: Form element does not have a name")
                    }

                    function moveFocusToFirstInvalidInput() {
                        var formInputs = form.element.find('input');
                        for (var i = 0; i < formInputs.length; i++) {
                            if (angular.element(formInputs[i]).hasClass('ng-invalid')) {
                                formInputs[i].focus();
                                break;
                            }
                        }
                    }

                    function touchAllInputs() {
                        for (var i = 0; i < form.inputs.length; i++) {
                            form.inputs[i].$dirty = true;
                            form.inputs[i].$pristine = false;
                            angular.element(form.inputs[i].element).removeClass('ng-pristine');
                            angular.element(form.inputs[i].element).addClass('ng-dirty');
                        }
                        form.$setDirty();
                    }

                    function validate(resetInputsBeforeValidating) {
                        if (resetInputsBeforeValidating) form.resetInputs(); // Necessary sometime when an input is added (eg by ng-if) after the initial setting of the inputs
                        form.touchAllInputs();
                        if (form.$valid) {
                            return true;
                        } else {
                            form.moveFocusToFirstInvalidInput();
                            return false;
                        }
                    }

                }
            };
        }]);

    function firstAncestorWithClass(element, clazz) {
        var parent = angular.element(element).parent();
        if (parent.length > 0) {
            if (parent.hasClass(clazz)) {
                return parent;
            } else {
                return firstAncestorWithClass(parent, clazz);
            }
        } else {
            return null;
        }
    }

    function firstAncestorWithTagName(element, tagname) {
        var parent = angular.element(element).parent();
        if (parent.length > 0) {
            if (tagname && parent[0].nodeName.toLowerCase() === tagname.toLowerCase()) {
                return parent;
            } else {
                return firstAncestorWithTagName(parent, tagname);
            }
        } else {
            return null;
        }
    }

    function getObjectPathValue(object, path) {
        if (!object || !path) {
            return null;
        } else if (path.length === 0) {
            return null;
        } else if (path.match(/\./)) {
            var nextNode = path.replace(/\..*/, '');
            var remainingPath = path.replace(/[^\.]*\./, '');
            return getObjectPathValue(object[nextNode], remainingPath);
        } else {
            return object[path]
        }
    }

    function setObjectPathValue(object, path, value) {
        if (object && path && path.length > 0) {
            if (path.match(/\./)) {
                var nextNode = path.replace(/\..*/, '');
                var remainingPath = path.replace(/[^\.]*\./, '');
                setObjectPathValue(object[nextNode], remainingPath);
            } else {
                object[path] = value;
            }
        }
    }

    function extractWindowLocationSearchParameters(windowLocationSearch) {
        var pairs = windowLocationSearch.substring(1).split("&");
        var obj = {};
        var pair;
        var i;

        for (i in pairs) {
            if (pairs[i] === "")
                continue;

            pair = pairs[i].split("=");
            obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }

        return obj;
    }

    function JiService($filter) {

        this.firstAncestorWithClass = firstAncestorWithClass;
        this.firstAncestorWithTagName = firstAncestorWithTagName;

        this.validateForm = function (form, options) {
            var firstInvalidField = null;
            for (fieldName in form) {
                if (fieldName[0] != '$') {
                    var field = form[fieldName];
                    if (typeof field.$valid != 'undefined' && !field.$valid) {
                        if (!firstInvalidField) firstInvalidField = field;
                        if (field && field.$pristine) {
                            field.$setViewValue(field.$viewValue)
                        }
                    }
                }
            }
            if (firstInvalidField) {
                if (firstInvalidField.element) {
                    firstInvalidField.element.focus();
                }
                return false;
            } else {
                return true;
            }
        };

        //this.showErrorDialog = function (response) {
        //    var dialogTitle, errorMessage;
        //    if (response) {
        //        //if (response.ignore) {
        //        //    return;
        //        //} else
        //        if (response.data && response.data.errorName) {
        //            dialogTitle = response.data.errorName;
        //            errorMessage = response.data.errorMessage ? response.data.errorMessage : JSON.stringify(response);
        //        } else if (response.config && response.config.url) {
        //            dialogTitle = response.status ? 'HTTP ' + response.status + ' error' : 'Error';
        //            errorMessage = response.statusText ? response.statusText + ' for ' + response.config.url : 'For ' + response.config.url;
        //        } else {
        //            dialogTitle = 'Error ';
        //            errorMessage = typeof response === 'string' ? response : JSON.stringify(response);
        //        }
        //    } else {
        //        dialogTitle = 'Error ';
        //        errorMessage = '';
        //    }
        //    $modal.open({
        //        template: '<div class="modal-header"><h3 class="modal-title">{{dialogTitle}}</h3></div>\n<div class="modal-body">\n    {{errorMessage}}\n</div>\n<div class="modal-footer">\n    <button class="btn btn-danger" ng-click="ok()">Ok</button>\n</div>',
        //        controller: function ($scope, $modalInstance, dialogTitle) {
        //            $scope.dialogTitle = dialogTitle;
        //            $scope.errorMessage = errorMessage;
        //            $scope.ok = function () {
        //                $modalInstance.close();
        //            };
        //        },
        //        windowClass: !dialogTitle || dialogTitle.length > 25
        //            ? 'ji-error-dialog-lg'
        //            : 'ji-error-dialog',
        //        resolve: {
        //            dialogTitle: function () { return dialogTitle; },
        //            errorMessage: function () { return errorMessage; }
        //        },
        //        backdrop: false
        //    });
        //};
        //
        //this.showMessageDialog = function (messageOrOptions) {
        //    var providedResultHandler;
        //    if (messageOrOptions.message) {
        //        options = messageOrOptions;
        //    } else {
        //        options = {message: messageOrOptions};
        //    }
        //    if (!options.buttons) {
        //        options.buttons = [{class: 'btn-primary', title: 'Ok'}]
        //    }
        //    $modal.open({
        //        template: '<div ng-show="options.title" class="modal-header"><h3 class="modal-title" ng-bind-html="options.title"></h3></div>\n<div class="modal-body" ng-bind-html="options.message"></div>\n<div class="modal-footer" ng-style="!options.title ? {\'border-top-style\': \'none\'} : null">\n    <button ng-repeat="button in options.buttons" class="btn" ng-class="button.class" ng-click="buttonClicked(button.value ? button.value : button.title)" ng-bind-html="button.title"></button>\n</div>',
        //        controller: function ($scope, $modalInstance, options) {
        //            $scope.options = options;
        //            $scope.buttonClicked = function (value) {
        //                $modalInstance.close();
        //                if (providedResultHandler) {
        //                    providedResultHandler(value);
        //                }
        //            };
        //        },
        //        windowClass: options.dialogWidth ? 'ji-message-dialog-' + options.dialogWidth : 'ji-message-dialog-250px',
        //        resolve: {
        //            options: function () { return options; }
        //        },
        //        backdrop: false
        //    });
        //    return {
        //        then: function (resultHandler) {
        //            providedResultHandler = resultHandler;
        //        }
        //    }
        //};
        //
        //this.showPickDateDialog = function (dialogTitle) {
        //    var providedResultHandler;
        //    $modal.open({
        //        template: "<div ng-if=\"dialogTitle\" class=\"modal-header\"><h4 class=\"modal-title\">{{dialogTitle}}</h4></div>\n<div class=\"modal-body\" style=\"text-align: center; padding: 15px\">\n    <div style=\"display:inline-block; text-align: right\">\n        <datepicker ng-model=\"selectedDate\" min-date=\"minDate\" show-weeks=\"false\" ng-change=\"dateSelected(selectedDate)\"></datepicker>\n        <button class=\"btn-sm btn-default\" style=\'margin-top: 10px; padding: 3px\' ng-click=\"cancel()\">Cancel</button>\n    </div>\n</div>",
        //        controller: function ($scope, $modalInstance, dialogTitle) {
        //            $scope.dialogTitle = dialogTitle;
        //            $scope.dateSelected = function (selectedDate) {
        //                if (providedResultHandler) {
        //                    providedResultHandler(selectedDate);
        //                }
        //                $modalInstance.close();
        //            };
        //            $scope.cancel = function () {
        //                $modalInstance.close();
        //            };
        //        },
        //        windowClass: dialogTitle && dialogTitle.length > 25
        //            ? 'ji-date-dialog-lg'
        //            : 'ji-date-dialog',
        //        resolve: {
        //            dialogTitle: function () { return dialogTitle; }
        //        },
        //        backdrop: false
        //    });
        //    return {
        //        then: function (resultHandler) {
        //            providedResultHandler = resultHandler;
        //        }
        //    }
        //};

        //this.ngGridTextSearchFilter = function (gridOptions, searchText, item) {
        //    if (!gridOptions) throw new Error("gridOptions must be provided");
        //    if (!item) return null;
        //    if (!searchText) return item;
        //
        //    var searchRegExp = new RegExp("(" + searchText + ")", "i");
        //    var newItem = angular.copy(item);
        //    newItem.originalItem = item;
        //    var fieldsToSearch = determineFieldsToSearch();
        //
        //    // Highlight any search pattern occurrences
        //    findAndHighlightHits(fieldsToSearch);
        //    if (anythingFound(fieldsToSearch)) {
        //        return newItem;
        //    } else {
        //        return null;
        //    }
        //
        //    function anythingFound(fieldNames) {
        //        for (var i = 0; i < fieldNames.length; i++) {
        //            if (item[fieldNames[i]] !== newItem[fieldNames[i]]) {
        //                return true;
        //            }
        //        }
        //        return false;
        //    }
        //
        //    function findAndHighlightHits(fieldNames) {
        //        for (var i = 0; i < fieldNames.length; i++) {
        //            if (newItem[fieldNames[i]]) {
        //                newItem[fieldNames[i]] = newItem[fieldNames[i]].replace(searchRegExp, "<span class='ji-found-text'>$1</span>");
        //            }
        //        }
        //    }
        //
        //    function determineFieldsToSearch() {
        //        var i, fields = [];
        //        if (gridOptions.$gridScope) {  // ng-grid
        //            var candidateColumns = gridOptions.$gridScope.columns;
        //            for (i = 0; i < candidateColumns.length; i++) {
        //                if (candidateColumns[i].colDef.textSearchable && candidateColumns[i].visible) {
        //                    fields.push(candidateColumns[i].field)
        //                }
        //            }
        //        } else {                       // ui-grid
        //            for (i = 0; i < gridOptions.columnDefs.length; i++) {
        //                if (gridOptions.columnDefs[i].textSearchable && (gridOptions.columnDefs[i].visible == undefined || gridOptions.columnDefs[i].visible)) {
        //                    fields.push(gridOptions.columnDefs[i].field)
        //                }
        //            }
        //        }
        //        return fields;
        //    }
        //
        //};

        this.isIn = function (item, items) {
            for (var i = 0; i < items.length; i++) {
                if (item === items[i]) return true;
            }
            return false;
        };

        this.coalesce = function (item1, item2, item3, item4, item5, item6, item7, item8, item9, item10, item11) {
            if (item11 || item11 === 0) {
                throw new Error('ji-angular-mobile coalesce(): A maximum of 10 items can be "coalesced"');
            }
            if (item1 || item1 === 0) return item1;
            else if (item2 || item2 === 0) return item2;
            else if (item3 || item3 === 0) return item3;
            else if (item4 || item4 === 0) return item4;
            else if (item5 || item5 === 0) return item5;
            else if (item6 || item6 === 0) return item6;
            else if (item7 || item7 === 0) return item7;
            else if (item8 || item8 === 0) return item8;
            else if (item9 || item9 === 0) return item9;
            else if (item10 || item10 === 0) return item10;
            else return null;
        };

        this.extractWindowLocationSearchParameters = extractWindowLocationSearchParameters;

    }

})();

// This is reluctantly added as a global because it needs to be accessed at the config stage
// by angularjs where it would not be possible to make it available as a service etc
JiConfig = {

    convertIso8601DateStringsToDates: function (dateString) {

        // Ignore things that aren't objects.
        if (typeof dateString !== "object") return dateString;

        for (var key in dateString) {
            if (!dateString.hasOwnProperty(key)) continue;

            var value = dateString[key];
            var match;
            // Check for string properties which look like dates.
            if (typeof value === "string" && (match = value.match(/^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/))) {
                var milliseconds = Date.parse(match[0])
                if (!isNaN(milliseconds)) {
                    dateString[key] = new Date(milliseconds);
                }
            } else if (typeof value === "object") {
                JiConfig.convertIso8601DateStringsToDates(value);
            }
        }
    }

    //// Deprecated - only present to support angular 1.2.
    //// Use logonPageToUnauthorizedResponseInterceptor below for angular 1.3
    //logonPageToUnauthorizedResponseTransformFunction: function ($q) {
    //    return function (promise) {
    //        return promise.then(
    //            function (response) {
    //
    //                if (response.status === 200
    //                    && response.data
    //                    && typeof response.data === "string"
    //                    && response.data.substr(0, 22) === '<!-- logonPageFlag -->') {
    //
    //                    // Alter response
    //                    response.status = 401;
    //                    response.statusText = 'Unauthorized';
    //                    response.generatedByLogonPageToUnauthorizedResponseTransformFunction = true;
    //                    response.data = "HTTP 401: Unauthorized" + (response.config && response.config.url ? ' for ' + response.config.url : '');
    //
    //                    return $q.reject(response);
    //
    //                } else {
    //                    return response;
    //                }
    //
    //
    //            },
    //            function (response) {
    //                return $q.reject(response);
    //            });
    //
    //    }
    //
    //},
    //
    //// This is compatible with angular 1.3
    //logonPageToUnauthorizedResponseInterceptor: function ($q) {
    //
    //    return {
    //        'response': function (response) {
    //
    //            if (response.status === 200
    //                && response.data
    //                && typeof response.data === "string"
    //                && response.data.substr(0, 22) === '<!-- logonPageFlag -->') {
    //
    //                // Alter response
    //                response.status = 401;
    //                response.statusText = 'Unauthorized';
    //                response.generatedByLogonPageToUnauthorizedResponseTransformFunction = true;
    //                response.data = "HTTP 401: Unauthorized" + (response.config && response.config.url ? ' for ' + response.config.url : '');
    //
    //                return $q.reject(response);
    //
    //            } else {
    //                return response;
    //            }
    //
    //        }
    //    };
    //
    //}

};