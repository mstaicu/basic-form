/*
  The MIT License (MIT)

  Copyright (c) 2015 Mircea Staicu

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
 */

;(function() {
  'use strict';
  /**
   * [retrieveFrom Returns a Promise based GET request to retrieve the modal with the overlay from a local file]
   * @param  {[String]} url
   * @return {[Promise]}
   */
  function returnPromisedBasedResponseFrom(url){
    return new Promise(function(fulfill, reject){
      try {
        var request = new(XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');

        request.open('GET', url, true);
        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        request.onreadystatechange = function() {
          request.readyState > 3 && fulfill(request);
        };

        request.send()
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * [handleResponse Callback used as a success function for the Promise based GET request]
   * @param  {[Object]} response
   * @return {[void]}
   */
  function handleResponse(response){
    /*
     * Convert the reponse string representation to a valid DOM node, i.e.
     * "When one sets the innerHTML property of an element, the string containing the HTML is run through the parser."
     */
    var documentFragment = document.createElement('div');
    documentFragment.innerHTML = response.responseText;

    document.body.appendChild(documentFragment.children[0]);

    /*
     * Register all the even listeners
     */
    registerListeners();
  }

  /**
   * [eventListenerCallbacks Object holding references for the callback functions that are going to be registered for the event listeners]
   * @type {Object}
   */
  var eventListenerCallbacks = {
    'close-button' : handleModalBox,
    'cancel-button' : handleModalBox,
    'vehicleDamage' : vehicleDamageCallback,
    'makeBrand' : carLogoPreviewCallback
  }

  /**
   * [registerListeners Function that registers all the event listeners]
   * @return {[void]}
   */
  function registerListeners() {
    var form = document.getElementById('car-sell-form');

    /*
     * Event delegation for all INPUT type elements on 'blur' event, except the buttons
     */

    form.addEventListener('blur', function(event){
      /*
       * If we got an INPUT element proceed
       */
      var targetNode = event.target;

      if(targetNode.nodeType === 1 && targetNode.nodeName !== 'SELECT' && targetNode.nodeName !== 'BUTTON'){
        validateInputOnEvent(targetNode);
      }
    }, true);

    /*
     * Event delegation for all INPUT type elements on 'focus' event
     */

    form.addEventListener('focus', function(event){
      /*
       * If we got an INPUT element proceed
       */
      var targetNode = event.target;

      if(targetNode.nodeType === 1 && targetNode.nodeName !== 'SELECT' && targetNode.nodeName !== 'BUTTON'){
        cleanupInputValidation(targetNode);
      }
    }, true);

    /*
     * Register the other event listeners by mapping the callback references stored inside the @Object eventListenerCallbacks
     * To the appropriate INPUT type elements using data-attributes which contain the event types
     * ID attributes of the INPUT elements are used as the @Object eventListenerCallbacks property reference
     */
    [].slice.call(document.getElementById('modal-container').querySelectorAll('[data-event-on]')).forEach(function(input){
      input.addEventListener(input.getAttribute('data-event-on'), eventListenerCallbacks[input.getAttribute('id')]);
    });

    form.addEventListener('submit', validateForm);
  }

  /**
   * [validateInputOnEvent Function used for the validation and stylisation of the inputs]
   * @param  {[HTMLElement object]} element
   * @return {[void]}
   */
  function validateInputOnEvent(input){
    /*
     * HTML5 constraint validation API
     */
    var validationContainer = input.nextElementSibling,
      isInputValid = validateInput(input);

    /*
     * Using the HTML5 classList API to mark the state of an input as valid or invalid using visual glyphs
     */
    (isInputValid) ? validationContainer.classList.add('input-icon', 'valid-glyphs') : validationContainer.classList.add('input-icon', 'invalid-glyphs');
  }

  /**
   * [cleanupInputValidation Function used to clean the input validation]
   * @param  {[HTMLElement object]} input
   * @return {[void]}
   */
  function cleanupInputValidation(input){
    var validationContainer = input.nextElementSibling;

    if(validationContainer.classList.length > 0) {
      validationContainer.removeAttribute('class');
    }
  }

  /**
   * [handleModalBox Function used for the creation of the overlay and the form | Also used to show / hide the same component]
   * @return {[void]}
   */
  function handleModalBox(){
    var modalElement = document.getElementById('modal-container');

    /*
     * If the modal does not exist in the DOM, we create it
     * Otherwise, we toggle it's visibility, performance issue case
     */

    if(!modalElement){
      returnPromisedBasedResponseFrom('modalMarkup.html')
        .then(handleResponse);
    }else {
      toggleVisibility(modalElement);
    }
  }

  /**
   * [toggleVisibility Function used to hide / display the form and its overlay background]
   * @param  {[HTMLElement object]} element
   * @return {[void]}
   */
  function toggleVisibility(element){
    /*
     * Clean the validation of the inputs (reset the form) and the brand logo
     */
    resetForm();

    /*
     * HTML5 classList API
     */
    element.classList.toggle('hidden');

    if(!element.classList.contains('hidden')){
      /*
       * Reflow animation trigger only when displaying the form
       */
      element.classList.contains('animate') && animateElementWithReflow(element, 'animate');
    }
  }

  /**
   * [resetForm This function is used to reset the form to its initial state]
   * @return {[void]}
   */
  function resetForm(){
    var form = document.getElementById('car-sell-form'),
      inputs = form.getElementsByTagName('input');

    /*
     * Reset the form to its initial state
     */
    form.reset();

    [].slice.call(inputs).filter(function(input){
      return input.type === 'text';
    }).forEach(function(input){
      //Glyphs container
      var glyphs = input.nextElementSibling;

      glyphs.classList.length > 0 && glyphs.removeAttribute('class');
    });

    /*
     * Remove the logo
     */
    var logoPreview = document.querySelector('.brand-container-preview img');
    logoPreview.getAttribute('src') !== '' && logoPreview.removeAttribute('src');

    /*
     * Remove the vehicle damage details container
     */
    var vehicleDamageDetails = document.querySelector('.vehicle-damage-details');
    !!vehicleDamageDetails && vehicleDamageDetails.parentNode.removeChild(vehicleDamageDetails);
  }

  /**
   * [vehicleDamageCallback Callback callback used for the Vehicle damage event listener]
   * @param  {[Object]} event
   * @return {[void]}
   */
  function vehicleDamageCallback(event){
    var action = event.target.value,
      parentElement = event.target.parentElement,
      vehicleDamageDetailsContainer = document.createElement('div');

    vehicleDamageDetailsContainer.setAttribute('class', 'vehicle-damage-details');

    var vehicleDamageDetailsElement = document.querySelector('.' +vehicleDamageDetailsContainer.getAttribute('class'));

    /*
     * If the user choses 'yes' and there is no vehicle damage details INPUT element
     */

    if (action === 'yes' && !vehicleDamageDetailsElement) {
      var labelForVehicleDamageDetails = document.createElement('label');
      labelForVehicleDamageDetails.setAttribute('for', 'vehicleDamageDetails');
      labelForVehicleDamageDetails.appendChild(document.createTextNode('Vehicle damage details:'));

      var vehicleDamageDetailsInput = document.createElement('input');
      vehicleDamageDetailsInput.setAttribute('name', 'vehicleDamageDetails');
      vehicleDamageDetailsInput.setAttribute('id', 'vehicleDamageDetails');
      vehicleDamageDetailsInput.setAttribute('placeholder', 'What are the damages?');
      vehicleDamageDetailsInput.setAttribute('type', 'text');
      vehicleDamageDetailsInput.setAttribute('required', '');
      vehicleDamageDetailsInput.setAttribute('class', 'float-right');

      vehicleDamageDetailsContainer.appendChild(labelForVehicleDamageDetails);

      /*
       * Glyphs
       */
      var inputGlyphsContainer = document.createElement('div');
      inputGlyphsContainer.appendChild(vehicleDamageDetailsInput);
      inputGlyphsContainer.appendChild(document.createElement('span'));

      vehicleDamageDetailsContainer.appendChild(inputGlyphsContainer);

      parentElement.appendChild(vehicleDamageDetailsContainer);

      /*
       * Animate it
       */
      animateElementWithReflow(vehicleDamageDetailsContainer, 'show');

    /*
     * Otherwise, if the user choses 'no' or '-' and there is a vehicle damage details input
     * We remove it
     */
    } else if((action === 'no' || action === '-') && vehicleDamageDetailsElement && vehicleDamageDetailsElement.classList.contains('show')){
      parentElement.removeChild(vehicleDamageDetailsElement);
    } else {
      /*
       * Reading offsetWidth forces reflow
       */
      animateElementWithReflow(vehicleDamageDetailsElement, 'show');
    }
  }

  /**
   * [animateElementWithReflow A function which animates an element]
   * @param  {[HTMLElement]} element [Element to animate]
   * @param  {[String]} class   [Animation CSS class]
   * @return {[void]}
   */
  function animateElementWithReflow(element, cssClass){
    /*
     * Reading offsetWidth forces reflow
     */
    element.classList.remove(cssClass);
    element.offsetWidth;
    element.classList.add(cssClass);
  }

  /**
   * [carLogoPreviewCallback Callback callback used for the Brand event listener]
   * @param  {[Object]} event
   * @return {[void]}
   */
  function carLogoPreviewCallback(event){
    /*
     * Get the preview element
     */
    var brandPreview = document.querySelector('.brand-container-preview img'),
      brand = event.target.value;

    if (brand.length > 1) {
      /*
       * Build the URL
       * TODO: Use SVG, if possible
       */
      var logoURL = '_/images/' +brand+ '.png';

      /*
       * Append the image
       */
      brandPreview.src = logoURL;
    } else {
      brandPreview.removeAttribute('src');
    }
  }

  /**
   * [validateForm This callback function is called whenever a user tries to submit a form, it runs a validation on all INPUT type elements and applies the appropriate style]
   * @param  {[Object]} event
   * @return {[void]}
   */
  function validateForm(event){
    var inputsToBeValidated = [].slice.call(this.getElementsByTagName('input')).filter(function(input){
      return input.type === 'text';
    });
    /*
     * Validate and style accordingly
     */
    inputsToBeValidated.forEach(function(input){
      var isInputValid = validateInput(input),
          validationContainer = input.nextElementSibling;

      if (isInputValid) {
        validationContainer.classList.add('input-icon', 'valid-glyphs');
      } else {
        event.preventDefault();
        validationContainer.classList.add('input-icon', 'invalid-glyphs');
      }
    });

    /*
     * Check form to see if it passes all our checks
     */
    var isFormValid = inputsToBeValidated.every(validateInput);

    if(isFormValid){
      /*
       * Submit data for processing
       */
    }
  }

  /**
   * [validateInput Callback for INPUT type elements validation]
   * @param  {[HTMLElement]} input
   * @return {[Boolean]} [input is valid or not]
   */
  function validateInput(input){
    /*
     * HTML5 constraint validation API
     */
    var isInputValid = input.checkValidity();
    /*
     * Check to see if 'mileage' input is a valid number, custom case
     */
    if(input.name === 'mileage') {
      isInputValid = isInputValid && (!isNaN(parseFloat(input.value)) && isFinite(input.value));
    }

    return isInputValid;
  }

  document.getElementById('open-modal').addEventListener('click', handleModalBox);

})();