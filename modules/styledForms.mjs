/**
  * @name styledForms.mjs
  * @description Improved form elements. Custom styling of form elements through JS.
  * @version 0.1
  * @author Jan Prazak
  * @website https://github.com/Amarok24/
  * @license MPL-2.0
  This Source Code Form is subject to the terms of the Mozilla Public License,
  v. 2.0. If a copy of the MPL was not distributed with this file, you can
  obtain one at http://mozilla.org/MPL/2.0/.
*/


/**
 * Custom dropdown (select+option)
 * @param elemID ID of target element.
 * @param content Object which accepts keys: textContents, selectedIndex
 */
export function styleSelectboxId(elemID, content = {}) {
  const {textContents, selectedIndex} = content;

  console.info("textContents is ", textContents);
  console.info("selectedIndex is ", selectedIndex);


}
