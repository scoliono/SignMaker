const app = (function() {
	let post = {};
	let currentlySelectedPanelIndex = -1;

	/**
	 * Initialize the application.
	 */
	const init = function() {
		// Create the post on which to place panels
		post = new Post(Post.prototype.polePositions[0]);

		// Populate post position options
		const postPositionSelectElmt = document.getElementById("postPosition");
		for (const polePosition of Post.prototype.polePositions) {
			lib.appendOption(postPositionSelectElmt, polePosition, {selected : (polePosition == "Left")});
		}

		// Populate color options
		const colorSelectElmt = document.getElementById("panelColor");
		for (const color in lib.colors) {
			lib.appendOption(colorSelectElmt, color, {text : color});
		}

		// Populate exit tab position options
		const exitTabPositionSelectElmt = document.getElementById("exitTabPosition");
		for (const position of ExitTab.prototype.positions) {
			lib.appendOption(exitTabPositionSelectElmt, position, {selected : (position == "Right")});
		}

		// Populate exit tab width options
		const exitTabWidthSelectElmt = document.getElementById("exitTabWidth");
		for (const width of ExitTab.prototype.widths) {
			lib.appendOption(exitTabWidthSelectElmt, width, {selected : (width == "Narrow")});
		}

		// Populate the shield position options
		const shieldPositionsSelectElmt = document.getElementById("shieldsPosition");
		for (const position of Sign.prototype.shieldPositions) {
			lib.appendOption(shieldPositionsSelectElmt, position, {selected : (position == "Above")});
		}

		// Populate the guide arrow options
		const guideArrowSelectElmt = document.getElementById("guideArrow");
		for (const guideArrow of Sign.prototype.guideArrows) {
			lib.appendOption(guideArrowSelectElmt, guideArrow);
		}

		newPanel();
	};

	/**
	 * Create a new panel and add it to the post.
	 *   Set the currently selected panel for editing to the new panel.
	 *   Update the form to reflect the new panel.
	 *   Redraw the page.
	 */
	const newPanel = function() {
		post.newPanel();
		currentlySelectedPanelIndex = post.panels.length - 1;
		updateForm();
		redraw();
	};

	/**
	 * Duplicate the currently selected panel.
	 *   Set the currently selected panel for editing to the newly duplicated panel.
	 *   Update the form to reflect the new panel.
	 *   Redraw the page.
	 */
	const duplicatePanel = function() {
		post.duplicatePanel(currentlySelectedPanelIndex);
		currentlySelectedPanelIndex++;
		updateForm();
		redraw();
	};

	/**
	 * Delete the currently selected panel.
	 *   Set the currently selected panel for editing to the panel ahead of the deleted panel.
	 *   Update the form to reflect the newly selected panel.
	 *   Redraw the page.
	 */
	const deletePanel = function() {
		post.deletePanel(currentlySelectedPanelIndex);
		if (currentlySelectedPanelIndex > 0) {
			currentlySelectedPanelIndex--;
		}
		if (post.panels.length == 0) {
			newPanel();
		} else {
			updateForm();
			redraw();
		}
	};

	/**
	 * Shift the currently selected panel left.
	 *   Set the currently selected panel for editing to the new index.
	 *   Redraw the page.
	 */
	const shiftLeft = function() {
		currentlySelectedPanelIndex = post.shiftLeft(currentlySelectedPanelIndex);
		document.getElementById("panelEditing").selectedIndex = currentlySelectedPanelIndex;
		redraw();
	};

	/**
	 * Shift the currently selected panel right.
	 *   Set the currently selected panel for editing to the new index.
	 *   Redraw the page.
	 */
	const shiftRight = function() {
		currentlySelectedPanelIndex = post.shiftRight(currentlySelectedPanelIndex);
		document.getElementById("panelEditing").selectedIndex = currentlySelectedPanelIndex;
		redraw();
	};

	/**
	 * Change the current panel being edited.
	 *   Update the form to reflect the newly selected panel.
	 */
	const changeEditingPanel = function() {
		currentlySelectedPanelIndex = Number(document.getElementById("panelEditing").value);
		updateForm();
	};

	/**
	 * Add a new shield to the current panel's sign.
	 *   Update the shield subform with the new shield.
	 */
	const newShield = function() {
		const sign = post.panels[currentlySelectedPanelIndex].sign;
		sign.newShield();
		updateShieldSubform();
		redraw();
	};

	/**
	 * Delete a shield to the current panel's sign.
	 *   Update the shield subform with the new shield.
	 */
	const deleteShield = function() {
		const sign = post.panels[currentlySelectedPanelIndex].sign;
		sign.deleteShield(this.dataset.shieldIndex);
		updateShieldSubform();
		redraw();
	};

	/**
	 * Read the form and update the currently selected panel with the new values.
	 *   Redraw the page.
	 */
	const readForm = function() {
		const form = document.forms[0];
		const panel = post.panels[currentlySelectedPanelIndex];

		// Post
		post.polePosition = form["postPosition"].value;

		// Exit Tab
		panel.color = form["panelColor"].value;
		panel.exitTab.number = form["exitNumber"].value;
		panel.exitTab.width = form["exitTabWidth"].value;
		panel.exitTab.position = form["exitTabPosition"].value;

		// Sign
		panel.sign.controlText = form["controlText"].value;
		panel.sign.shieldPosition = form["shieldsPosition"].value;
		panel.sign.guideArrow = form["guideArrow"].value;
		panel.sign.guideArrowLanes = form["guideArrowLanes"].value;
		panel.sign.actionMessage = form["actionMessage"].value;
		panel.sign.actionMessage = panel.sign.actionMessage.replace("1/2", "½");
		panel.sign.actionMessage = panel.sign.actionMessage.replace("1/4", "¼");
		panel.sign.actionMessage = panel.sign.actionMessage.replace("3/4", "¾");

		// Shileds
		panel.sign.shieldBacks = form["shieldBacks"].checked;
		for (let shieldIndex = 0, length = panel.sign.shields.length; shieldIndex < length; shieldIndex++) {
			panel.sign.shields[shieldIndex].type = document.getElementById(`shield${shieldIndex}_type`).value;
			panel.sign.shields[shieldIndex].routeNumber = document.getElementById(`shield${shieldIndex}_routeNumber`).value;
			panel.sign.shields[shieldIndex].to = document.getElementById(`shield${shieldIndex}_to`).checked;
			panel.sign.shields[shieldIndex].bannerType = document.getElementById(`shield${shieldIndex}_bannerType`).value;
			panel.sign.shields[shieldIndex].bannerPosition = document.getElementById(`shield${shieldIndex}_bannerPosition`).value;
		}

		// Action Message
		if (panel.sign.guideArrow == "Action Message") {
			form["actionMessage"].style.display = "block";
		} else {
			form["actionMessage"].style.display = "none";
		}

		redraw();
	};

	/**
	 * Update the fields in the form to the values of the currently selected panel.
	 */
	const updateForm = function() {
		const editingPanelSelectElmt = document.getElementById("panelEditing");
		lib.clearChildren(editingPanelSelectElmt);
		for (let panelIndex = 0, panelsLength = post.panels.length; panelIndex < panelsLength; panelIndex++) {
			lib.appendOption(editingPanelSelectElmt, panelIndex, {selected : panelIndex == currentlySelectedPanelIndex, text : `Panel ${panelIndex + 1}`});
		}

		const panel = post.panels[currentlySelectedPanelIndex];

		const panelColorSelectElmt = document.getElementById("panelColor");
		for (const option of panelColorSelectElmt.options) {
			if (option.value == panel.color) {
				option.selected = true;
				break;
			}
		}

		const exitNumberElmt = document.getElementById("exitNumber");
		exitNumberElmt.value = panel.exitTab.number;

		const exitTabPositionSelectElmt = document.getElementById("exitTabPosition");
		for (const option of exitTabPositionSelectElmt.options) {
			if (option.value == panel.exitTab.position) {
				option.selected = true;
				break;
			}
		}

		const exitTabWidthSelectElmt = document.getElementById("exitTabWidth");
		for (const option of exitTabWidthSelectElmt.options) {
			if (option.value == panel.exitTab.width) {
				option.selected = true;
				break;
			}
		}

		updateShieldSubform();

		const shieldPositionsSelectElmt = document.getElementById("shieldsPosition");
		for (const option of shieldPositionsSelectElmt.options) {
			if (option.value == panel.sign.shieldPosition) {
				option.selected = true;
				break;
			}
		}

		const shieldBacksElmt = document.getElementById("shieldBacks");
		shieldBacksElmt.checked = panel.sign.shieldBacks;

		const controlTextElmt = document.getElementById("controlText");
		controlTextElmt.value = panel.sign.controlText;

		const guideArrowSelectElmt = document.getElementById("guideArrow");
		for (const option of guideArrowSelectElmt.options) {
			if (option.value == panel.sign.guideArrow) {
				option.selected = true;
				break;
			}
		}

		const guideArrowLanesElmt = document.getElementById("guideArrowLanes");
		guideArrowLanesElmt.value = panel.sign.guideArrowLanes;

		const actionMessageElmt = document.getElementById("actionMessage");
		if (panel.sign.guideArrow == "Action Message") {
			actionMessageElmt.style.display = "block";
		} else {
			actionMessageElmt.style.display = "none";
		}
		actionMessageElmt.value = panel.sign.actionMessage;
	};

	/**
	 * Update the fields in the form relating to shields to the values of the currently selected panel.
	 */
	const updateShieldSubform = function() {
		const shieldsContainerElmt = document.getElementById("shields");
		lib.clearChildren(shieldsContainerElmt);

		const shields = post.panels[currentlySelectedPanelIndex].sign.shields;

		for (let shieldIndex = 0, length = shields.length; shieldIndex < length; shieldIndex++) {
			const rowContainerElmt = document.createElement("div");

			const toCheckElmt = document.createElement("input");
			toCheckElmt.type = "checkbox";
			toCheckElmt.id = `shield${shieldIndex}_to`;
			toCheckElmt.name = `shield${shieldIndex}_to`;
			toCheckElmt.checked = shields[shieldIndex].to;
			toCheckElmt.addEventListener("change", readForm);
			rowContainerElmt.appendChild(toCheckElmt);

			const toCheckLabelElmt = document.createElement("label");
			toCheckLabelElmt.setAttribute("for", `shield${shieldIndex}_to`);
			toCheckLabelElmt.appendChild(document.createTextNode(" TO "));
			rowContainerElmt.appendChild(toCheckLabelElmt);

			// Populate shield options
			const typeSelectElmt = document.createElement("select");
			for (const type in Shield.prototype.types) {
				lib.appendOption(typeSelectElmt, Shield.prototype.types[type], {selected : (shields[shieldIndex].type == Shield.prototype.types[type]), text : type});
			}
			typeSelectElmt.id = `shield${shieldIndex}_type`;
			typeSelectElmt.addEventListener("change", readForm);
			rowContainerElmt.appendChild(typeSelectElmt);

			const routeNumberElmt = document.createElement("input");
			routeNumberElmt.type = "text";
			routeNumberElmt.id = `shield${shieldIndex}_routeNumber`;
			routeNumberElmt.placeholder = "00";
			routeNumberElmt.value = shields[shieldIndex].routeNumber;
			routeNumberElmt.addEventListener("change", readForm);
			rowContainerElmt.appendChild(routeNumberElmt);

			// Populate banner type options
			const bannerTypeSelectElmt = document.createElement("select");
			for (const bannerType of Shield.prototype.bannerTypes) {
				lib.appendOption(bannerTypeSelectElmt, bannerType, {selected : (shields[shieldIndex].bannerType == bannerType)});
			}
			bannerTypeSelectElmt.id = `shield${shieldIndex}_bannerType`;
			bannerTypeSelectElmt.addEventListener("change", readForm);
			rowContainerElmt.appendChild(bannerTypeSelectElmt);

			// Populate banner position options
			const bannerPositionSelectElmt = document.createElement("select");
			for (const bannerPosition of Shield.prototype.bannerPositions) {
				lib.appendOption(bannerPositionSelectElmt, bannerPosition, {selected : (shields[shieldIndex].bannerPosition == bannerPosition)});
			}
			bannerPositionSelectElmt.id = `shield${shieldIndex}_bannerPosition`;
			bannerPositionSelectElmt.addEventListener("change", readForm);
			rowContainerElmt.appendChild(bannerPositionSelectElmt);

			const deleteElmt = document.createElement("input");
			deleteElmt.type = "button";
			deleteElmt.value = "Delete";
			deleteElmt.dataset.shieldIndex = shieldIndex;
			deleteElmt.addEventListener("click", deleteShield);
			rowContainerElmt.appendChild(deleteElmt);

			shieldsContainerElmt.appendChild(rowContainerElmt);
		}
	};

	/**
	 * Redraw the panels on the post.
	 */
	function executeIfFileExist(src) {
		var request = new XMLHttpRequest(); 
		var result = 0; 
		request.open('GET', src, false);
		request.onreadystatechange = function(){
			if (request.readyState === 4){
				if (request.status === 404) {  
				} 
				
			}
			result = request.status;
		};
		request.send();
		return result;
	}
	const redraw = function() {
		const postContainerElmt = document.getElementById("postContainer");
		postContainerElmt.className = `polePosition${post.polePosition}`;

		const panelContainerElmt = document.getElementById("panelContainer");		
		
		lib.clearChildren(panelContainerElmt);
		for (const panel of post.panels) {
			const panelElmt = document.createElement("div");
			panelElmt.className = `panel ${panel.color.toLowerCase()}`;

			const exitTabElmt = document.createElement("div");
			exitTabElmt.className = `exitTab ${panel.exitTab.position.toLowerCase()} ${panel.exitTab.width.toLowerCase()}`;
			panelElmt.appendChild(exitTabElmt);

			const signElmt = document.createElement("div");
			signElmt.className = "sign";
			panelElmt.appendChild(signElmt);

			const sideLeftArrowElmt = document.createElement("div");
			sideLeftArrowElmt.className = "sideLeftArrow";
			sideLeftArrowElmt.appendChild(document.createTextNode(lib.specialCharacters.sideLeftArrow));
			signElmt.appendChild(sideLeftArrowElmt);

			const signContentContainerElmt = document.createElement("div");
			signContentContainerElmt.className = `signContentContainer shieldPosition${panel.sign.shieldPosition}`;
			signElmt.appendChild(signContentContainerElmt);

			const shieldsContainerElmt = document.createElement("div");
			shieldsContainerElmt.className = `shieldsContainer ${panel.sign.shieldBacks ? "shieldBacks" : ""}`;
			signContentContainerElmt.appendChild(shieldsContainerElmt);

			const controlTextElmt = document.createElement("p");
			controlTextElmt.className = "controlText";
			signContentContainerElmt.appendChild(controlTextElmt);

			const sideRightArrowElmt = document.createElement("div");
			sideRightArrowElmt.className = "sideRightArrow";
			sideRightArrowElmt.appendChild(document.createTextNode(lib.specialCharacters.sideRightArrow));
			signElmt.appendChild(sideRightArrowElmt);

			const guideArrowsElmt = document.createElement("div");
			guideArrowsElmt.className = `guideArrows ${panel.sign.guideArrow.replace("/", "-").replace(" ", "_").toLowerCase()}`;
			panelElmt.appendChild(guideArrowsElmt);

			panelContainerElmt.appendChild(panelElmt);

			// Exit tab
			if (panel.exitTab.number) {
				const txtArr = panel.exitTab.number.toUpperCase().split(/(\d+\S*)/);
				const spanTextElmt = document.createElement("span");
				spanTextElmt.appendChild(document.createTextNode(txtArr[0]))
				exitTabElmt.appendChild(spanTextElmt);
				if (txtArr.length > 1) {
					const spanNumeralElmt = document.createElement("span");
					spanNumeralElmt.className = "numeral";
					spanNumeralElmt.appendChild(document.createTextNode(txtArr[1]));
					exitTabElmt.appendChild(spanNumeralElmt);
					exitTabElmt.appendChild(document.createTextNode(txtArr.slice(2).join("")));
				}
				exitTabElmt.style.visibility = "visible";
			}

			// Shields
			for (const shield of panel.sign.shields) {
				const toElmt = document.createElement("p");
				toElmt.className = "to";
				toElmt.appendChild(document.createTextNode("TO"));
				shieldsContainerElmt.appendChild(toElmt);

				const bannerShieldContainerElmt = document.createElement("div");
				bannerShieldContainerElmt.className = `bannerShieldContainer ${shield.type} ${shield.bannerType.toLowerCase()} bannerPosition${shield.bannerPosition}`;
				switch (shield.routeNumber.length) {
					case 1:
						bannerShieldContainerElmt.className += " one";
						break;
					case 2:
						bannerShieldContainerElmt.className += " two";
						break;
					case 3:
						bannerShieldContainerElmt.className += " three";
						break;
					default:
						bannerShieldContainerElmt.className += " three";
						break;
				}
				shieldsContainerElmt.appendChild(bannerShieldContainerElmt);

				const bannerElmt = document.createElement("p");
				bannerElmt.className = "banner";
				bannerShieldContainerElmt.appendChild(bannerElmt);

				const shieldElmt = document.createElement("div");
				shieldElmt.className = "shield";
				bannerShieldContainerElmt.appendChild(shieldElmt);

				const shieldImgElmt = document.createElement("object");
				shieldImgElmt.type = "image/svg+xml";
				shieldImgElmt.className = "shieldImg";
				shieldElmt.appendChild(shieldImgElmt);

				const routeNumberElmt = document.createElement("p");
				routeNumberElmt.className = "routeNumber";
				shieldElmt.appendChild(routeNumberElmt);

				if (shield.to) {
					toElmt.style.display = "inline";
					bannerShieldContainerElmt.style.marginLeft = "0";
				}

				// If "Shield Backs" is checked, use directory with images of shields with backs
				//   else, use directory with images of shields with no backs
				let imgDir;
				if (panel.sign.shieldBacks) {
					imgDir = "img/shields-with-backs/";
				} else {
					imgDir = "img/shields-without-backs/";
				}
				
				// Shield type
				var lengthValue = shield.routeNumber.length;
				if (shield.routeNumber.length > 3) {
					lengthValue = 3;
				}
				else if (shield.routeNumber.length == 1) {
					lengthValue = 2;
				}
				var fileExists = 404;
				var ignoreBanner = false;
				var attempts = 0;
				while(fileExists != 200) {
					imgFileConstr = shield.type + "-" + lengthValue;
					if (shield.bannerType != "None" && !ignoreBanner) {
						imgFileConstr += "-" + shield.bannerType;
					}
					console.log("File to check: " + imgDir + imgFileConstr + ".svg");
					fileExists = executeIfFileExist(imgDir + imgFileConstr + ".svg");
					if (lengthValue == 0) {
						if (shield.bannerType != "None" && !ignoreBanner) {
							if (attempts = 0) {
								lengthValue = 3;
								attempts ++;
							}
							else {
								ignoreBanner = true;
								lengthValue = shield.routeNumber.length;
								if (shield.routeNumber.length > 3) {
									lengthValue = 3;
								}
								else if (shield.routeNumber.length == 1) {
									lengthValue = 2;
								}
							}
							console.log(lengthValue);
						}
						else {
							fileExists = 200;
						}
					}
					console.log(imgFileConstr);
					lengthValue -= 1;
					console.log(imgFileConstr +" ok?");
				}
				shieldImgElmt.data = imgDir + imgFileConstr + ".svg";
				//shield
				

				// Route Number
				routeNumberElmt.appendChild(document.createTextNode(shield.routeNumber));

				// Route banner
				if (shield.bannerType != "None") {
					bannerElmt.appendChild(document.createTextNode(shield.bannerType));
				}

				// Special states
				
			}

			// Control text
			// Remove and re-add the controlText text
			const controlTextArray = panel.sign.controlText.split("\n");
			for (let lineNum = 0, length = controlTextArray.length - 1; lineNum < length; lineNum++) {
				controlTextElmt.appendChild(document.createTextNode(controlTextArray[lineNum]));
				controlTextElmt.appendChild(document.createElement("br"));
			}
			controlTextElmt.appendChild(document.createTextNode(controlTextArray[controlTextArray.length - 1]));

			// Guide arrows
			if ("Side Left" == panel.sign.guideArrow) {
				sideLeftArrowElmt.style.display = "block";
			} else if ("Side Right" == panel.sign.guideArrow) {
				sideRightArrowElmt.style.display = "block";
			} else if ("None" != panel.sign.guideArrow) {
				signElmt.style.borderBottomLeftRadius = "0";
				signElmt.style.borderBottomRightRadius = "0";
				signElmt.style.borderBottomWidth = "0";
				guideArrowsElmt.style.display = "block";

				if ("Exit Only" == panel.sign.guideArrow) {
					const exitOnlyArrowElmt = function() {
						const exitOnlyArrowElmt = document.createElement("span");
						exitOnlyArrowElmt.className = "exitOnlyArrow";
						exitOnlyArrowElmt.appendChild(document.createTextNode(lib.specialCharacters["Down Arrow"]));
						return exitOnlyArrowElmt;
					}
					const downArrowElmt = function() {
						const downArrowElmt = document.createElement("span");
						downArrowElmt.className = "arrow";
						downArrowElmt.style.fontFamily = "Arrows Two";
						downArrowElmt.appendChild(document.createTextNode(lib.specialCharacters["Down Arrow"]));
						return downArrowElmt;
					}

					// Interlase arrows and the words EXIT and ONLY, ensuring
					//   EXIT ONLY is centered between all the arrows.
					for (let arrowIndex = 0, length = panel.sign.guideArrowLanes; arrowIndex < length; arrowIndex++) {
						// Evens
						if (length %2 == 0) {
							if (arrowIndex == Math.floor(length/2)) {
								const textExitOnlySpanElmt = document.createElement("span");
								textExitOnlySpanElmt.appendChild(document.createTextNode("EXIT ONLY"));
								textExitOnlySpanElmt.className = "exitOnlyText";
								guideArrowsElmt.appendChild(textExitOnlySpanElmt);
								guideArrowsElmt.appendChild(exitOnlyArrowElmt());
							} else {
								guideArrowsElmt.appendChild(downArrowElmt());
							}
						} else { // Odds
							if (arrowIndex == Math.floor(length/2)) {
								const textExitSpanElmt = document.createElement("span");
								textExitSpanElmt.appendChild(document.createTextNode("EXIT"));
								textExitSpanElmt.className = "exitOnlyText";
								guideArrowsElmt.appendChild(textExitSpanElmt);
								guideArrowsElmt.appendChild(exitOnlyArrowElmt());
								const textOnlySpanElmt = document.createElement("span");
								textOnlySpanElmt.appendChild(document.createTextNode("ONLY"));
								textOnlySpanElmt.className = "exitOnlyText";
								guideArrowsElmt.appendChild(textOnlySpanElmt);
							} else if (arrowIndex == Math.ceil(length/2)) {
								guideArrowsElmt.appendChild(exitOnlyArrowElmt());
							} else {
								guideArrowsElmt.appendChild(downArrowElmt());
							}
						}
					}
				} else {
					if (panel.sign.guideArrow == "Action Message") {
						guideArrowsElmt.style.display = "flex";
						const txtArr = panel.sign.actionMessage.split(/(\d+\S*)/);
						guideArrowsElmt.appendChild(document.createTextNode(txtArr[0]));
						if (txtArr.length > 1) {
							const spanElmt = document.createElement("span");
							spanElmt.className = "numeral";
							spanElmt.appendChild(document.createTextNode(txtArr[1]));
							guideArrowsElmt.appendChild(spanElmt);
							guideArrowsElmt.appendChild(document.createTextNode(txtArr.slice(2).join("")));
						}
					} else {
						if (panel.sign.guideArrow == "Down Arrow" || panel.sign.guideArrow == "Up Arrow") {
							guideArrowsElmt.style.fontFamily = "Arrows Two";
						} else {
							guideArrowsElmt.style.fontFamily = "Arrows One";
						}
						for (let arrowIndex = 0, length = panel.sign.guideArrowLanes; arrowIndex < length; arrowIndex++) {
							const arrowElmt = document.createElement("span");
							arrowElmt.className = "arrow";
							let arrowChoice = panel.sign.guideArrow;
							if (panel.sign.guideArrow.includes("/Up")) {
								arrowElmt.className += " rotate180";
							}
							arrowElmt.appendChild(document.createTextNode(lib.specialCharacters[arrowChoice]));
							guideArrowsElmt.appendChild(arrowElmt);
						}
					}
				}
			}
		}
	};

	return {
		init : init,
		newPanel : newPanel,
		duplicatePanel : duplicatePanel,
		deletePanel : deletePanel,
		shiftLeft : shiftLeft,
		shiftRight : shiftRight,
		changeEditingPanel : changeEditingPanel,
		newShield : newShield,
		readForm : readForm
	};
})();
