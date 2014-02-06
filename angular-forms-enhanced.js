/*global angular:false */

(function (angular) {

  'use strict';

  var app = angular.module('ngFormsEnhanced',[]);

  var PRISTINE_CLASS = 'ng-pristine',
      DIRTY_CLASS = 'ng-dirty';

  var noop = angular.noop;

  var nullFormCtrl = {
    $addControl: noop,
    $removeControl: noop,
    $setValidity: noop,
    $setDirty: noop,
    $setPristine: noop,
    $updatePristine: noop
  };

  var formDirective = function(directiveName, restrict) {
    app.directive(directiveName, function() {
      return {
        restrict: restrict,
        require: 'form',
        compile: function() {
          return {
            pre: function(scope, element, attrs, form) {
              var parentForm = element.parent().controller('form') || nullFormCtrl;
              
              var $addControl = form.$addControl,
                  $removeControl = form.$removeControl;
              
              form.$controls = [];
              
              form.$addControl = function(control) {
                form.$controls.push(control);
                $addControl(control);
              };

              form.$removeControl = function(control) {
                var index = form.$controls.indexOf(control);
                if (index >= 0) {
                  form.$controls.splice(index, 1);
                }
                $removeControl(control);
              };
              
              form.$updatePristine = function() {
                for (var i = 0; i < form.$controls.length; i+=1) {
                  if (form.$controls[i].$dirty) {
                    return;
                  }
                }
       
                form.$setPristine();
       
                if (parentForm) {
                  parentForm.$updatePristine();
                }
              };
            }
          };
        }
      };
    });
  };
   
  formDirective('form', 'E');
  formDirective('ngForm', 'EAC');
   
  app.directive('ngModel', ['$parse','$exceptionHandler', function($parse, $exceptionHandler) {

    return {
      require: ['ngModel','^?form'],
      compile: function(tElement, tAttrs) {

        var ngModelGet = $parse(tAttrs.ngModel),
            ngModelSet = ngModelGet.assign;

        return {
          pre: function(scope, element, attrs, ctrl) {

            var ngModel = ctrl[0],
                parentForm = ctrl[1] || nullFormCtrl;

            // var parentForm = element.inheritedData('$formController');
            ngModel.$pristineValue = null;

            // new method

            if (parentForm) {
              ngModel.$updatePristine = function() {
                parentForm.$updatePristine();
              };
            }

            // wrap
            var $setPristine = ngModel.$setPristine;
            
            ngModel.$setPristine = function() {
              $setPristine.call(ngModel);
              ngModel.$pristineValue = null;
            };

            // replace with a patched version

            ngModel.$setViewValue = function(value) {

              // keep state unchanged
              if (value === ngModel.$viewValue) {
                return;
              }

              if (! ngModel.$pristine) {
  
                ngModel.$viewValue = value;

                // rollback to pristine
                if (ngModel.$pristineValue === value) {
                  ngModel.$setPristine();
                  ngModel.$updatePristine();
                }
              } else {

                // change to dirty
                ngModel.$pristineValue = ngModel.$viewValue;
                ngModel.$viewValue = value;
                ngModel.$dirty = true;
                ngModel.$pristine = false;
                element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
                parentForm.$setDirty();

              }

              angular.forEach(ngModel.$parsers, function(fn) {
                value = fn(value);
              });

              if (ngModel.$modelValue !== value) {
                ngModel.$modelValue = value;
                ngModelSet(scope, value);
                angular.forEach(ngModel.$viewChangeListeners, function(listener) {
                  try {
                    listener();
                  } catch(e) {
                    $exceptionHandler(e);
                  }
                });
              }
            };
          }
        };
      }
    };
  }]);

}(angular));


