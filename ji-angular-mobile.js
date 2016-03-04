/*

 ji-angular-mobile-1.0.4.js

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

    var jiErrorModalInstance = {};

    angular.module('jiAngularMobile', ['mobile-angular-ui'])

        //========== ji service ==========//
        .factory('ji', ['SharedState', function (SharedState) { return new JiService(SharedState); }])

        //========== logonDialog service etc ==========//
        //.factory('jiLogonDialog', function ($modal) { return new LogonDialogService($modal); })
        //.controller('LogonDialogController', LogonDialogController)

        //========== ResetPasswordDialog service etc ==========//
        //.factory('jiResetPasswordDialog', function ($modal) { return new ResetPasswordDialogService($modal); })
        //.controller('ResetPasswordDialogController', ResetPasswordDialogController)

        //========== ji-error-modal ==========//
        .directive('jiErrorModal', function () {

            return {
                restrict: 'EA',
                replace: 'false',
                controller: Controller,
                template: function () {
                    return "<div class=\"modal modal-overlay\" ui-if='jiErrorModal' ui-state='jiErrorModal'>\n" +
                           "    <div class=\"modal-dialog\" style=\"width: 100%; height: 100%\">\n" +
                           "        <div class=\"modal-content\" style=\"position:relative; width: 100%; height: 100%\">\n" +
                           "            <div class=\"modal-header\" style=\"position: absolute; top: 0; right: 0; left: 0\">\n" +
                           "                <h4 class=\"modal-title text-danger\">{{modal.title}}</h4>\n" +
                           "            </div>\n" +
                           "            <div class=\"scrollable\" style='padding-top: 40px'>\n" +
                           "                <div class=\"modal-body scrollable-content\">\n" +
                           "\n" +
                           "                    <br/>\n" +
                           "                    <p class=\"text-danger\">{{modal.errorMessage}}</p>\n" +
                           "\n" +
                           "                </div>\n" +
                           "                <div class=\"modal-footer scrollable-footer\">\n" +
                           "                    <button class=\"btn btn-danger\" ng-click=\"close()\">Ok</button>\n" +
                           "                </div>\n" +
                           "            </div>\n" +
                           "\n" +
                           "        </div>\n" +
                           "    </div>\n" +
                           "</div>";
                }
            };

            function Controller($scope, SharedState) {

                $scope.modal = jiErrorModalInstance;

                $scope.close = function () {
                    SharedState.turnOff('jiErrorModal');
                };

            }

        })

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

    function JiService(SharedState) {

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

        this.showErrorModal = function (response) {
            var dialogTitle, errorMessage, errorInfo;
            if (response) {
                if (response.data && response.data.errorName) {
                    dialogTitle = response.data.errorName;
                    errorMessage = response.data.errorMessage ? response.data.errorMessage : JSON.stringify(response);
                } else if (response.error && response.message) {
                    dialogTitle = response.status ? 'HTTP ' + response.status + ' error: ' + response.error : 'Error';
                    errorMessage = response.message;
                } else if (response.data && response.data.error && response.data.message) {
                    dialogTitle = response.data.status ? 'HTTP ' + response.data.status + ' error: ' + response.data.error : 'Error';
                    errorMessage = response.data.message;
                } else if (response.config && response.config.url) {
                    dialogTitle = response.status ? 'HTTP ' + response.status + ' error' : 'Error';
                    errorMessage = response.statusText ? response.statusText + ' for ' + response.config.url : 'For ' + response.config.url;
                } else if (response.message) {
                    dialogTitle = response.status ? 'HTTP ' + response.status + ' error' : 'Error';
                    errorMessage = response.message;
                } else {
                    dialogTitle = 'Error ';
                    errorMessage = typeof response === 'string' ? response : JSON.stringify(response);
                }
                if (response.errorInfo) {
                    errorInfo = response.errorInfo;
                } else if (response.data && response.data.errorInfo) {
                    errorInfo = response.data.errorInfo;
                }
            } else {
                dialogTitle = 'Error ';
                errorMessage = '';
            }

            jiErrorModalInstance.title = dialogTitle;
            jiErrorModalInstance.errorMessage = errorMessage;
            jiErrorModalInstance.errorInfo = errorInfo;
            SharedState.turnOn('jiErrorModal');

        };

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

    }

})();

// This is reluctantly added as a global because it needs to be accessed at the config stage
// by angularjs where it would not be possible to make it available as a service etc
JiGlobal = {

    extractWindowLocationSearchParameters: function (windowLocationSearch) {
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
    },

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
                JiGlobal.convertIso8601DateStringsToDates(value);
            }
        }
    },

    baseAppConfig: function ($provide, $httpProvider) {

        // If $httpProvider.responseInterceptors exists then angular 1.2.x is being used
        if ($httpProvider.responseInterceptors) {
            $httpProvider.responseInterceptors.push(JiGlobal.logonPageToUnauthorizedResponseTransformFunction);
        } else {
            $httpProvider.interceptors.push(JiGlobal.logonPageToUnauthorizedResponseInterceptor);
        }

        // default exception handler just logs uncaught exceptions - this will show an alert also
        $provide.decorator("$exceptionHandler", function ($delegate) {
            return function (exception, cause) {
                $delegate(exception, cause);
                var errorMessage, causeMessage;
                if (typeof exception === "string") {
                    errorMessage = exception;
                } else if (exception.message) {
                    errorMessage = exception.message;
                } else {
                    errorMessage = angular.toJson(exception, "pretty");
                }
                if (cause) {
                    alert('exception:\n' + errorMessage
                          + '\n\ncause:\n' + (typeof cause === "string" ? cause : angular.toJson(cause, "pretty")));
                } else {
                    alert(errorMessage);
                }
            };
        });


        // This is commented out as it seems to conflict with the spring url
        // Conditionally set the html5Mode to remove the # in the urls (if possible)
//                if (window.history && window.history.pushState) {
//                    $locationProvider.html5Mode(true);
//                }

    },

    // Deprecated - only present to support angular 1.2.
    // Use logonPageToUnauthorizedResponseInterceptor below for angular 1.3
    logonPageToUnauthorizedResponseTransformFunction: function ($q) {
        return function (promise) {
            return promise.then(
                function (response) {

                    if (response.status === 200
                        && response.data
                        && typeof response.data === "string"
                        && response.data.substr(0, 22) === '<!-- logonPageFlag -->') {

                        // Alter response
                        response.status = 401;
                        response.statusText = 'Unauthorized';
                        response.generatedByLogonPageToUnauthorizedResponseTransformFunction = true;
                        response.data = "HTTP 401: Unauthorized" + (response.config && response.config.url ? ' for ' + response.config.url : '');

                        return $q.reject(response);

                    } else {
                        return response;
                    }


                },
                function (response) {
                    return $q.reject(response);
                });

        }

    },

    // This is compatible with angular 1.3
    logonPageToUnauthorizedResponseInterceptor: function ($q) {

        return {
            'response': function (response) {

                if (response.status === 200
                    && response.data
                    && typeof response.data === "string"
                    && response.data.substr(0, 22) === '<!-- logonPageFlag -->') {

                    // Alter response
                    response.status = 401;
                    response.statusText = 'Unauthorized';
                    response.generatedByLogonPageToUnauthorizedResponseTransformFunction = true;
                    response.data = "HTTP 401: Unauthorized" + (response.config && response.config.url ? ' for ' + response.config.url : '');

                    return $q.reject(response);

                } else {
                    return response;
                }

            }
        };

    }

};