var app = angular.module('demo', ['ngFormsEnhanced']);

app.controller('MainCtrl', function($scope) {
  $scope.list = [
    
    { key : "help" , en : "Help" , he: "עזרה"},
    { key : "want" , en : "Want" , he: "רוצה"},
    { key : "name" , en : "Name" , he: "שם"},
    { key : "email" , en : "Email" }
  ]

  $scope.user = "Ilan Frumer";
  $scope.person = "Misko";
  
  $scope.save = function(item, form){
    form.$setPristine();
    console.log("saved all");
  }

  $scope.saveAll = function(form){
    console.log("saved all");
    form.$setPristine();
  }
});


app.directive("contenteditable", function() {
  return {
    require: "?ngModel",
    link: function(scope, element, attrs, ngModel) {
      if (ngModel) {

        // DOM -> view
        element.bind("blur", function() {
          var val = element.html();
          scope.$apply(function(){
            ngModel.$setViewValue(val);
          });
        });
        
        // view -> DOM
        ngModel.$render = function() {
          element.html(ngModel.$viewValue || '');
        };
      }
    }
  };
});