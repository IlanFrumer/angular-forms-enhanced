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
                $addControl(control);
                form.$controls.push(control);
              };

              form.$removeControl = function(control) {
                $removeControl(control);
                var index = form.$controls.indexOf(control);
                if (index >= 0) {
                  form.$controls.splice(index, 1);
                }
              };

              // new method
              form.$revert = function () {
                for (var i = 0; i < form.$controls.length; i+=1) {
                  if (form.$controls[i].$dirty) {
                    form.$controls[i].$revert(true);
                  }
                }
                form.$setPristine();
              };
                
              // override $setPristine

              form.$setPristine = function(skip) {
                
                element.removeClass(DIRTY_CLASS).addClass(PRISTINE_CLASS);
                form.$dirty = false;
                form.$pristine = true;

                if(!skip) {
                  angular.forEach(form.$controls, function(control) {
                    control.$setPristine();
                  });
                }
                parentForm.$updatePristine();
              };

              form.$updatePristine = function() {
                for (var i = 0; i < form.$controls.length; i+=1) {
                  if (form.$controls[i].$dirty) {
                    return;
                  }
                }
                form.$setPristine(true);
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

            var $original = (function () {
              var $value = null,
                  $isEmpty = true;
              return {
                get: function() {
                  return $value;
                },
                set: function(val) {
                  if (ngModel.$pristine) {
                    $value = ngModel.$modelValue;
                    $isEmpty = ngModel.$isEmpty($value);
                  }
                  // let value pass in $formatters
                  return val;
                },
                equals: function(val) {
                  if(ngModel.$invalid) {
                    return false;
                  } else if($isEmpty) {
                    return ngModel.$isEmpty(val);
                  } else {
                    return angular.equals($value,val);
                  }
                }
              };
            }());

            ngModel.$formatters.unshift($original.set);

            var updateModel = function(value) {
              ngModelSet(scope, value);
              angular.forEach(ngModel.$viewChangeListeners, function(listener) {
                try {
                  listener();
                } catch(e) {
                  $exceptionHandler(e);
                }
              });
            };

            // new method

            ngModel.$revert = function(skip) {
              if (!$original.equals(ngModel.$modelValue)) {
                if (!skip) {
                  ngModel.$dirty = false;
                  ngModel.$pristine = true;
                  element.removeClass(DIRTY_CLASS).addClass(PRISTINE_CLASS);
                  parentForm.$updatePristine();
                }
                updateModel($original.get());
              }
            };

            // override $setPristine
            
            ngModel.$setPristine = function() {
              ngModel.$dirty = false;
              ngModel.$pristine = true;
              element.removeClass(DIRTY_CLASS).addClass(PRISTINE_CLASS);
              $original.set();
              parentForm.$updatePristine();
            };

            // override $setViewValue

            ngModel. $setViewValue = function(value) {

              ngModel.$viewValue = value;

              angular.forEach(ngModel.$parsers, function(fn) {
                value = fn(value);
              });

              if (ngModel.$modelValue !== value) {

                ngModel.$modelValue = value;

                if (ngModel.$dirty) {
                  // rollback to pristine
                  if ($original.equals(value)) {
                    ngModel.$setPristine();
                  }
                } else {
                  if(!$original.equals(value)) {
                    // change to dirty
                    ngModel.$dirty = true;
                    ngModel.$pristine = false;
                    element.removeClass(PRISTINE_CLASS).addClass(DIRTY_CLASS);
                    parentForm.$setDirty();
                  }
                }

                updateModel(value);
              }
            };
          }
        };
      }
    };
  }]);

}(angular));
