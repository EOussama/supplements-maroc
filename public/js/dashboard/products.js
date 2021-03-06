$('document').ready(() => {
	// Getting all flavors.
	var flavors = JSON.parse($('#flavors-json').text());

	// Initializing tabs.
	$('.dashboard-products .tabs').tabs();

	// Initializing the collapsibles.
	$('.dashboard-products .collapsible').collapsible();

	// Initializing the materialbox.
	$('.dashboard-products .materialboxed').materialbox();

	// Setting up the dropdowns.
	$('#stock-creation-modal-type, #stock-edition-modal-type').formSelect();

	// Product creation.
	(function () {
		// Getting frequently used elements.
		var $stockCreationList = $('#stock-creation-list'),
			$stockCreationModal = $('#stock-creation-modal');

		// Initializing the product object.
		var Product = {
			Name: '',
			NutritionInfo: '',
			BrandID: 0,
			CategoryID: 0,
			Description: '',
			Usage: '',
			Warning: '',
			Stock: []
		};

		// The selection index.
		var currentIndex = -1;

		// Initializing QuillJS.
		var descEditor = new Quill('#desc-editor', {
			theme: 'snow'
		}),
			usageEditor = new Quill('#usage-editor', {
				theme: 'snow'
			}),
			warningEditor = new Quill('#warning-editor', {
				theme: 'snow'
			});

		// Updating the UI.
		updateUI();

		// Setting up the dropdowns.
		$('#product-creation-brand, #product-creation-category').formSelect();

		// Initializing the character counter.
		$(
			'.dashboard-products #product-creation-name, .dashboard-products #product-creation-nutrition-info'
		).characterCounter();

		// Submiting a new product creation to the server-side.
		$('#product-creation-form').on('submit', function (e) {
			// Stopping the page from reloading.
			e.preventDefault();

			// Retrieving information.
			Product.Name = $('#product-creation-name').val();
			Product.NutritionInfo = $('#product-creation-nutrition-info').val();
			Product.BrandID = $('#product-creation-brand').val();
			Product.CategoryID = $('#product-creation-category').val();
			Product.Description = descEditor.container.innerHTML;
			Product.Usage = usageEditor.container.innerHTML;
			Product.Warning = warningEditor.container.innerHTML;

			if (confirm('هل ترغب في إضافة هذا المنتوج؟')) {
				$.post('/dashboard/products', Product, function () {
					location.reload();
				});
			}
		});

		// Reseting the product creation.
		$('#product-creation-form').on('reset', function () {
			if (confirm('هل تريد إعادة ضبط كل شيء؟')) {
				// Reseting the product tracking object.
				Product = {
					Name: '',
					NutritionInfo: '',
					BrandID: 0,
					CategoryID: 0,
					Description: '',
					Usage: '',
					Warning: '',
					Stock: []
				};

				// Clearing the inputs.
				descEditor.clipboard.dangerouslyPasteHTML('');
				usageEditor.clipboard.dangerouslyPasteHTML('');
				warningEditor.clipboard.dangerouslyPasteHTML('');
				$('.nutrition-facts-creation-preview img').attr(
					'src',
					'/assets/img/backgrounds/placeholder.jpg'
				);

				// Updating the UI.
				updateUI();
			}
		});

		// Nutrition facts preview.
		$('#product-creation-nutrition-info').on('change', function () {
			$('.nutrition-facts-creation-preview img').attr('src', $(this).val());

			if (
				$('.nutrition-facts-creation-preview img').on('error', function () {
					$('.nutrition-facts-creation-preview img').attr(
						'src',
						'/assets/img/backgrounds/placeholder.jpg'
					);
				})
			);
		});

		// Handeling the submit event on the stock-creation-modal.
		$('#stock-creation-form').on('submit', function (e) {
			// Preventing the page from loading.
			e.preventDefault();

			// Closing the modal.
			$stockCreationModal.modal('close');

			// Getting the inputs.
			var $stockValueInput = $(this).find('#stock-creation-modal-value'),
				$stockTypeInput = $(this).find('#stock-creation-modal-type');
			$stockPriceInput = $(this).find('#stock-creation-modal-price');

			// Adding a new stock.
			addNewStock({
				Value: $stockValueInput.val(),
				Type: $stockTypeInput.val(),
				Price: $stockPriceInput.val(),
				CurrentIndex: -1,
				FeaturedVariant: false,
				Flavors: [],
				Tags: []
			});

			// Clearing the inputs.
			$stockValueInput.val('');
			$stockPriceInput.val('');
		});

		// Handeling the click event on the stock-creation-clear-btn.
		$('#stock-creation-clear-btn').on('click', function () {
			// Clearing the created stock.
			Product.Stock = [];

			// Updating the current index.
			currentIndex = -1;

			// Updating the UI.
			updateUI();
		});

		function addNewStock(stock) {
			// Adding the stock.
			Product.Stock.push(stock);

			// Updating the currenr index.
			currentIndex = Product.Stock.length - 1;

			// Setting the default featured variant.
			if (Product.Stock.length === 1) {
				setFeaturedStock(0);
			}

			// Updating the UI.
			updateUI();
		}

		function removeStock(index) {
			// Remove a stock.
			Product.Stock.splice(index, 1);

			// Updating the current index.
			currentIndex =
				currentIndex === index
					? -1
					: currentIndex >= 0
						? currentIndex < index
							? currentIndex
							: currentIndex - 1
						: -1;

			// Setting the default featured variant.
			if (Product.Stock.length > 0) {
				if (
					Product.Stock.filter(function (s) {
						if (s.FeaturedVariant) {
							return true;
						} else {
							return false;
						}
					}).length <= 0
				)
					setFeaturedStock(0);
			}

			// Updating the UI.
			updateUI();
		}

		function setFeaturedStock(index) {
			// Removing all other featured products.
			for (var i = 0; i < Product.Stock.length; i++) {
				if (i === index) {
					Product.Stock[i].FeaturedVariant = true;
				} else {
					Product.Stock[i].FeaturedVariant = false;
				}
			}

			// Updating the UI.
			updateUI();
		}

		function addFlavor(index, flavor) {
			var unUsedFlavor = (function () {
				var flvList = $.map(Product.Stock[index]['Flavors'], function (f) {
					return f['FlavorID'];
				});

				var unUsedFlavors = $.map(flavors, function (flv) {
					return flvList.indexOf(flv['FlavorID']) === -1
						? flv['FlavorID']
						: null;
				});

				if (unUsedFlavors == null) {
					return null;
				} else {
					return unUsedFlavors[0];
				}
			})();

			if (unUsedFlavor != null) {
				// Override flavorId.
				flavor['FlavorID'] = unUsedFlavor;

				// Adding a flavor.
				Product.Stock[index].Flavors.push(flavor);

				// Updating the current index.
				Product.Stock[index].CurrentIndex =
					Product.Stock[index].Flavors.length - 1;
			} else {
				alert('لا توجد نكهات متبقية');
			}

			// Updating the UI.
			updateUI();
		}

		function removeFlavor(index, flavorIndex) {
			// Removing a flavor.
			Product.Stock[index].Flavors.splice(flavorIndex, 1);

			// Updating the current index.
			if (index < Product.Stock[index].CurrentIndex) {
				Product.Stock[index].CurrentIndex--;
			}

			// Updating the UI.
			updateUI();
		}

		function updateStockCreationPreviews(ele) {
			ele
				.closest('.stock-creation-flavor-entry')
				.find('.stock-creation-entry-variant-image-preview img')
				.attr('src', ele.val());
			ele
				.closest('.stock-creation-flavor-entry')
				.find('.stock-creation-entry-variant-image-preview')
				.css('background-image', 'url(' + ele.val() + ')');

			if (
				ele
					.closest('.stock-creation-flavor-entry')
					.find('.stock-creation-entry-variant-image-preview img')
					.on('error', function () {
						ele
							.closest('.stock-creation-flavor-entry')
							.find('.stock-creation-entry-variant-image-preview img')
							.attr('src', '/assets/img/backgrounds/placeholder.jpg');
						ele
							.closest('.stock-creation-flavor-entry')
							.find('.stock-creation-entry-variant-image-preview')
							.css(
								'background-image',
								'url(/assets/img/backgrounds/placeholder.jpg)'
							);
					})
			);
		}

		function updateUI() {
			// Updating the stock count.
			$('#stock-creation-count').text(
				Product.Stock.reduce(function (total, stock) {
					return total + helper.calculateStockQuantity(stock);
				}, 0)
			);

			// Clearing the old output.
			$stockCreationList.empty();

			// Updating the stock list.
			Product.Stock.forEach(function (stock, index) {
				var stockFlavors = '';

				$.each(stock.Flavors, function (index, flavor) {
					var flavorsDropDown = '';

					$.each(flavors, function (idx, flv) {
						flavorsDropDown +=
							'<option value="' +
							flv.FlavorID +
							'" ' +
							(flv.FlavorID === flavor.FlavorID ? 'selected' : '') +
							' ' +
							(helper.isFlavorAllowed(stock.Flavors, flv.FlavorID)
								? ''
								: 'disabled') +
							'>' +
							flv.FlavorName +
							'</option>';
					});

					stockFlavors +=
						'\
      <li data-flavor-index="' +
						index +
						'" class="stock-creation-flavor-entry ' +
						(index === stock.CurrentIndex ? 'active' : '') +
						'">\
        <div class="collapsible-header">\
          <span class="valign-wrapper">\
            <i class="fas fa-trash stock-creation-flavor-remove-btn"></i>\
          </span>\
          <span class="valign-wrapper">\
          ' +
						flavor.Quantity +
						' &nbsp; <b>الكمية</b> <i class="material-icons">inbox</i>\
          </span >\
          <span class="valign-wrapper">\
          ' +
						helper.getFlavorNameFromID(flavor.FlavorID) +
						' &nbsp; <b>النكهة</b> <i class="material-icons">local_drink</i>\
          </span >\
        </div >\
        <div class="collapsible-body">\
          <div class="row">\
            <div class="col s6 stock-creation-entry-variant-image-preview">\
              <img src="/assets/img/backgrounds/placeholder.jpg">\
            </div>\
            <div class="col s6">\
              <div class="row">\
                <div class="input-field col s12">\
                  <select name="stock-creation-entry-flavor">\
                    ' +
						flavorsDropDown +
						'\
                  </select >\
                  <label>النكهة</label>\
                </div >\
              </div >\
              <div class="row">\
                <div class="input-field col s12 right-align">\
                  <label>الكمية</label>\
                    <input min="0" name="stock-creation-entry-quantity" type="number" value="' +
						flavor.Quantity +
						'" class="validate right-align" required>\
                  </label>\
                </div>\
              </div>\
            </div>\
          </div>\
          <div class="row ">\
            <div class="input-field col s12 stock-creation-entry-variant-image-wrapper">\
              <label>صورة المنتوج</label>\
              <input type="url" name="stock-creation-entry-variant-image" class="validate" value="' +
						flavor.VariantImage +
						'" required>\
            </div>\
          </div>\
        </div>\
      </li>\
    ';
				});

				$stockCreationList.append(
					'\
    <li data-id="' +
					index +
					'" class="stock-creation-entry ' +
					(index === currentIndex ? 'active' : '') +
					'">\
      <div class="collapsible-header stock-creation-header">\
        <span class="valign-wrapper">\
        <i class="fas fa-trash stock-creation-remove-btn"></i>\
          <i class="fas fa-star stock-creation-feature-btn ' +
					(stock.FeaturedVariant ? 'featured' : '') +
					'"></i>\
        </span>\
        <span class="valign-wrapper">\
        ' +
					helper.calculateStockQuantity(stock) +
					'&nbsp; <b>الكمية</b> <i class="material-icons">inbox</i> \
        </span>\
        <span class="valign-wrapper">\
        ' +
					helper.formatPrice(stock.Price) +
					'&nbsp; <b>السعر</b> <i class="material-icons">attach_money</i> \
        </span>\
				<span class="valign-wrapper">\
						' +
					helper.formatMeasurement(stock.Value, stock.Type) +
					'&nbsp; <b>القياس</b> <i class="fas fa-balance-scale"></i> \
        </span>\
      </div>\
      <div class="collapsible-body">\
        <div class="row">\
					<div class="col s4">\
						<div class="row"> \
							<div class="input-field col s12"> \
								<select name="stock-creation-entry-type"> \
									<option ' +
					(stock.Type === '1' ? 'selected' : '') +
					' value="1">الكيلوغرام</option> \
									<option ' +
					(stock.Type === '2' ? 'selected' : '') +
					' value="2">الحصة</option> \
									<option ' +
					(stock.Type === '3' ? 'selected' : '') +
					' value="3">القطعة</option> \
									<option ' +
					(stock.Type === '4' ? 'selected' : '') +
					' value="4">الحزمة</option> \
									<option ' +
					(stock.Type === '5' ? 'selected' : '') +
					' value="5">الملعقة</option> \
								</select> \
								<label>وحدة قياس</label> \
							</div> \
						</div> \
            <div class="row">\
              <div class="col s12 right-align">\
                <label>القياس\
                  <input min="0" name="stock-creation-entry-value" step="0.001" type="number" value="' +
					stock.Value +
					'" class="validate right-align" required>\
                </label>\
              </div>\
            </div>\
            <div class="row">\
              <div class="col s12 right-align">\
                <label>السعر <small class="grey-text">&rlm;(درهم)&rlm;</small>\
                  <input min="0" name="stock-creation-entry-price" type="number" step="0.01" value="' +
					stock.Price +
					'" class="validate right-align" required>\
                </label>\
              </div>\
						</div>\
						<div class="row"> \
							<div class="input-field col s12"> \
								<p class="grey-text right-align">الكلمات المرتبطة</p> \
								<div name="stock-creation-entry-tags" class="chips chips-placeholder chips-initial"></div> \
							</div> \
						</div> \
            <div class="row">\
              <div class="col s8 offset-s2">\
                <button class="btn btn-block btn-large waves-effect waves-light stock-creation-flavor-add-btn">إضافة نكهة للمنتوج</button>\
                </label>\
              </div>\
            </div>\
          </div>\
          <div class="col s7 offset-s1 stock-creation-entry-flavor-list">\
            <h5 class="right-align">[ ' +
					stock.Flavors.length +
					' ] النكهات</h5>\
            <ul class="collapsible">\
              ' +
					stockFlavors +
					'\
            </ul>\
          </div>\
        </div>\
      </div>\
    </li>'
				);
			});

			// Adding the stock remove click event.
			$('#stock-creation-list .stock-creation-remove-btn').on('click', function (
				e
			) {
				// Stopping event propagation.
				e.stopPropagation();

				// Getting the stock's index.
				var index = $(this)
					.closest('li')
					.data('id');

				// Removing the stock.
				removeStock(index);
			});

			// Adding the stock featuring click event.
			$('#stock-creation-list .stock-creation-feature-btn').on(
				'click',
				function (e) {
					// Stopping event propagation.
					e.stopPropagation();

					// Getting the stock's index.
					var index = $(this)
						.closest('li')
						.data('id');

					// Removing the stock.
					setFeaturedStock(index);
				}
			);

			// Adding the stock update event for price and weight inputs.
			$(
				'#stock-creation-list input[name=stock-creation-entry-price], #stock-creation-list input[name=stock-creation-entry-value], #stock-creation-list select[name=stock-creation-entry-type]'
			).on('change', function (e) {
				// Getting the stock's index.
				var index = $(this)
					.closest('li')
					.data('id');
				// Updaing the stock.
				if ($(this).attr('name') === 'stock-creation-entry-value') {
					Product.Stock[index].Value = $(this).val();
				} else if ($(this).attr('name') === 'stock-creation-entry-type') {
					Product.Stock[index].Type = $(this).val();
				} else if ($(this).attr('name') === 'stock-creation-entry-price') {
					Product.Stock[index].Price = $(this).val();
				}

				// Updating the UI.
				updateUI();
			});

			// Adding the index update event.
			$('#stock-creation-list .stock-creation-header').on('click', function () {
				if (
					!$(this)
						.parent()
						.hasClass('active')
				) {
					currentIndex = $(this)
						.parent()
						.data('id');
				} else {
					currentIndex = -1;
				}
			});

			// Adding the flavor addition event.
			$('.stock-creation-flavor-add-btn').on('click', function () {
				// Getting the stock's index.
				var index = $(this)
					.closest('li')
					.data('id');

				// Adding a flavor.
				addFlavor(index, {
					Quantity: 1,
					FlavorID: flavors[0].FlavorID,
					VariantImage: ''
				});
			});

			// Adding the flavor removal event.
			$('.stock-creation-flavor-remove-btn').on('click', function (e) {
				// Stopping event propagation.
				e.stopPropagation();

				// Getting the stock's index.
				var index = $(this)
					.closest('.stock-creation-entry')
					.data('id'),
					flavorIndex = $(this)
						.closest('li')
						.data('flavor-index');

				// Adding a flavor.
				removeFlavor(index, flavorIndex);
			});

			$(
				'.stock-creation-entry .stock-creation-flavor-entry .collapsible-header'
			).on('click', function () {
				// Getting the stock's index.
				var index = $(this)
					.closest('.stock-creation-entry')
					.data('id');

				if (
					!$(this)
						.parent()
						.hasClass('active')
				) {
					Product.Stock[index].CurrentIndex = $(this)
						.parent()
						.data('flavor-index');
				} else {
					Product.Stock[index].CurrentIndex = -1;
				}
			});

			// Adding the flavor update event.
			$('.stock-creation-entry .stock-creation-flavor-entry select').on(
				'change',
				function (e) {
					// Getting the stock's index.
					var index = $(this)
						.closest('.stock-creation-entry')
						.data('id'),
						flavorIndex = $(this)
							.closest('li')
							.data('flavor-index'),
						newFlavorId = parseInt($(e.target).val());

					// Updating the flavor.
					Product.Stock[index].Flavors[flavorIndex].FlavorID = newFlavorId;

					// Updating the UI.
					updateUI();
				}
			);

			// Adding the quantity update event.
			$('#stock-creation-list [name=stock-creation-entry-quantity]').on(
				'change',
				function (e) {
					// Getting the stock's index.
					var index = $(this)
						.closest('.stock-creation-entry')
						.data('id'),
						flavorIndex = $(this)
							.closest('li')
							.data('flavor-index'),
						quantity = parseInt($(e.target).val());

					// Updating the quantity.
					Product.Stock[index].Flavors[flavorIndex].Quantity = quantity;

					// Updating the UI.
					updateUI();
				}
			);

			// Variants' image preview.
			$('[name=stock-creation-entry-variant-image]').on('change', function (e) {
				// Getting the stock's index.
				var index = $(this)
					.closest('.stock-creation-entry')
					.data('id'),
					flavorIndex = $(this)
						.closest('li')
						.data('flavor-index'),
					image = $(e.target).val();

				// Updating the image.
				Product.Stock[index].Flavors[flavorIndex].VariantImage = image;

				// Updating the UI.
				updateUI();
			});

			// Updaing the previews.
			$.each($('[name=stock-creation-entry-variant-image]'), function (
				index,
				ele
			) {
				updateStockCreationPreviews($(ele));
			});

			// Re-initializing the collapsibles.
			$(
				'#stock-creation-list, #stock-creation-list .collapsible'
			).collapsible();

			// Re-initializing the chips input.
			$.each($('#stock-creation-list div.chips'), function (index, chip) {
				$(chip).chips({
					data: $.map(Product.Stock[index].Tags, function (tag) {
						return { tag };
					}),
					placeholder: 'كلمة مرتبطة',
					secondaryPlaceholder: '+ كلمة مرتبطة',
					onChipAdd: function () {
						// Updating the tags.
						Product.Stock[index].Tags = $.map($(this)[0].chipsData, function (
							tag
						) {
							return tag['tag'].indexOf(',') === -1 ? tag['tag'] : null;
						});
						updateUI();
					},
					onChipDelete: function () {
						// Updating the tags.
						Product.Stock[index].Tags = $.map($(this)[0].chipsData, function (
							tag
						) {
							return tag['tag'].indexOf(',') === -1 ? tag['tag'] : null;
						});
					}
				});
			});

			// Re-initializing the dropdowns.
			$('#stock-creation-list select').formSelect();
		}
	})();

	// Product edition.
	(function () {
		// Frequently used elements.
		var $productEditionModal = $('#product-edition-modal'),
			$stockEditionModal = $('#stock-edition-modal'),
			$stockEditionList = $('#stock-edition-list'),
			$productEditionName = $('#product-edition-name'),
			$productEditionNutritionInfo = $('#product-edition-nutrition-info'),
			$productEditionBrand = $('#product-edition-brand'),
			$productEditionCategory = $('#product-edition-category');

		// Initializing the product object.
		var Product = {
			ID: 0,
			Name: '',
			NutritionInfo: '',
			BrandID: 0,
			CategoryID: 0,
			Description: '',
			Usage: '',
			Warning: '',
			DeletedVariants: [],
			Stock: []
		};

		// The selection index.
		var currentIndex = -1;

		// Initializing QuillJS.
		var $descEditorEdit = new Quill('#desc-editor-edit', {
			theme: 'snow'
		}),
			$usageEditorEdit = new Quill('#usage-editor-edit', {
				theme: 'snow'
			}),
			$warningEditorEdit = new Quill('#warning-editor-edit', {
				theme: 'snow'
			});

		function addNewStock(stock) {
			// Adding the stock.
			Product.Stock.push(stock);

			// Updating the currenr index.
			currentIndex = Product.Stock.length - 1;

			// Setting the default featured variant.
			if (Product.Stock.length === 1) {
				setFeaturedStock(0);
			}

			// Updating the UI.
			updateUI();
		}

		function removeStock(index) {
			// Remove a stock.
			Product['DeletedVariants'].push(Product.Stock[index].VariantID);
			Product.Stock.splice(index, 1);

			// Updating the current index.
			currentIndex =
				currentIndex === index
					? -1
					: currentIndex >= 0
						? currentIndex < index
							? currentIndex
							: currentIndex - 1
						: -1;

			// Setting the default featured variant.
			if (
				Product.Stock.filter(function (s) {
					if (s.FeaturedVariant) {
						return true;
					} else {
						return false;
					}
				}).length <= 0
			)
				setFeaturedStock(0);

			// Updating the UI.
			updateUI();
		}

		function setFeaturedStock(index) {
			// Removing all other featured products.
			for (var i = 0; i < Product.Stock.length; i++) {
				if (i === index) {
					Product.Stock[i].FeaturedVariant = true;
				} else {
					Product.Stock[i].FeaturedVariant = false;
				}
			}

			// Updating the UI.
			updateUI();
		}

		function addFlavor(index, flavor) {
			var unUsedFlavor = (function () {
				var flvList = $.map(Product.Stock[index]['Flavors'], function (f) {
					return f['FlavorID'];
				});

				var unUsedFlavors = $.map(flavors, function (flv) {
					return flvList.indexOf(flv['FlavorID']) === -1
						? flv['FlavorID']
						: null;
				});

				if (unUsedFlavors == null) {
					return null;
				} else {
					return unUsedFlavors[0];
				}
			})();

			if (unUsedFlavor != null) {
				// Override flavorId.
				flavor['FlavorID'] = unUsedFlavor;

				// Adding a flavor.
				Product.Stock[index].Flavors.push(flavor);

				// Updating the current index.
				Product.Stock[index].CurrentIndex =
					Product.Stock[index].Flavors.length - 1;
			} else {
				alert('لا توجد نكهات متبقية');
			}

			// Updating the UI.
			updateUI();
		}

		function removeFlavor(index, flavorIndex) {
			// Removing a flavor.
			Product.Stock[index].DeletedFlavors.push(
				Product.Stock[index].Flavors[flavorIndex].FlavorID
			);
			Product.Stock[index].Flavors.splice(flavorIndex, 1);

			// Updating the current index.
			if (index < Product.Stock[index].CurrentIndex) {
				Product.Stock[index].CurrentIndex--;
			}

			// Updating the UI.
			updateUI();
		}

		// Updating the product previews.
		function updateStockCreationPreviews(ele) {
			ele
				.closest('.stock-edition-flavor-entry')
				.find('.stock-edition-entry-variant-image-preview img')
				.attr('src', ele.val());
			ele
				.closest('.stock-edition-flavor-entry')
				.find('.stock-edition-entry-variant-image-preview')
				.css('background-image', 'url(' + ele.val() + ')');

			if (
				ele
					.closest('.stock-edition-flavor-entry')
					.find('.stock-edition-entry-variant-image-preview img')
					.on('error', function () {
						ele
							.closest('.stock-edition-flavor-entry')
							.find('.stock-edition-entry-variant-image-preview img')
							.attr('src', '/assets/img/backgrounds/placeholder.jpg');
						ele
							.closest('.stock-edition-flavor-entry')
							.find('.stock-edition-entry-variant-image-preview')
							.css(
								'background-image',
								'url(/assets/img/backgrounds/placeholder.jpg)'
							);
					})
			);
		}

		// Setting up the dropdowns.
		$('#product-edition-brand, #product-edition-category').formSelect();

		// Setting up the character counters.
		$(
			'.dashboard-products #product-edition-name, .dashboard-products #product-edition-nutrition-info'
		).characterCounter();

		// Adding the click event to open the product edition modal.
		$('.product-list tr').on('click', function () {
			var productId = $(this).data('product-id');

			$.get('/dashboard/products/' + productId, function (data) {
				// Retrieving the values.
				Product.ID = data[0][0]['ProductID'];
				Product.Name = data[0][0]['ProductName'];
				Product.NutritionInfo = data[0][0]['NutritionInfo'];
				Product.BrandID = data[0][0]['BrandID'];
				Product.CategoryID = data[0][0]['CategoryID'];
				Product.Description = data[0][0]['Description'];
				Product.Usage = data[0][0]['Usage'];
				Product.Warning = data[0][0]['Warning'];
				Product.Stock = helper.groupStock(data[1], data[2]);

				// Updating the inputs.
				$productEditionName.val(Product.Name);
				$productEditionNutritionInfo.val(Product.NutritionInfo);
				$productEditionBrand.val(Product.BrandID);
				$productEditionCategory.val(Product.CategoryID);
				$descEditorEdit.clipboard.dangerouslyPasteHTML(Product.Description);
				$usageEditorEdit.clipboard.dangerouslyPasteHTML(Product.Usage);
				$warningEditorEdit.clipboard.dangerouslyPasteHTML(Product.Warning);
				$productEditionNutritionInfo.trigger('change');

				// Updating the UI.
				updateUI();

				// Opening the modal.
				$productEditionModal.modal('open', {
					preventScrolling: true
				});
			});
		});

		// Submiting a new product edition to the server-side.
		$('#product-edition-form').on('submit', function (e) {
			// Stopping the page from reloading.
			e.preventDefault();

			// Retrieving information.
			Product.Name = $productEditionName.val();
			Product.NutritionInfo = $productEditionNutritionInfo.val();
			Product.BrandID = $productEditionBrand.val();
			Product.CategoryID = $productEditionCategory.val();
			Product.Description = $descEditorEdit.container.innerHTML;
			Product.Usage = $usageEditorEdit.container.innerHTML;
			Product.Warning = $warningEditorEdit.container.innerHTML;

			if (confirm('هل تريد تحديث هذا المنتوج؟')) {
				$.ajax({
					url: '/dashboard/products',
					type: 'PUT',
					data: Product,
					success: function () {
						location.reload();
					}
				});
			}
		});

		// Reseting the product edition.
		$('#product-edition-form').on('reset', function () {
			if (confirm('هل تريد إعادة ضبط كل شيء؟')) {
				// Reseting the product tracking object.
				Product = {
					ID: Product.ID,
					Name: '',
					NutritionInfo: '',
					BrandID: 0,
					CategoryID: 0,
					Description: '',
					Usage: '',
					Warning: '',
					DeletedVariants: [],
					Stock: []
				};

				// Clearing the inputs.
				$descEditorEdit.clipboard.dangerouslyPasteHTML('');
				$usageEditorEdit.clipboard.dangerouslyPasteHTML('');
				$warningEditorEdit.clipboard.dangerouslyPasteHTML('');
				$('.nutrition-facts-edition-preview img').attr(
					'src',
					'/assets/img/backgrounds/placeholder.jpg'
				);

				// Updating the UI.
				updateUI();
			}
		});

		// Handeling the click event on the stock-edition-clear-btn.
		$('#stock-edition-clear-btn').on('click', function () {
			// Clearing the created stock.
			Product.Stock = [];

			// Updating the current index.
			currentIndex = -1;

			// Updating the UI.
			updateUI();
		});

		// Handeling the submit event on the stock-edition-modal.
		$('#stock-edition-form').on('submit', function (e) {
			// Preventing the page from loading.
			e.preventDefault();

			// Getting the inputs.
			var $stockValueInput = $(this).find('#stock-edition-modal-value'),
				$stockTypeInput = $(this).find('#stock-edition-modal-type');
			$stockPriceInput = $(this).find('#stock-edition-modal-price');

			if (
				Product.Stock.filter(function (prdct) {
					if (
						parseFloat(prdct.Value).toFixed(2) ===
						parseFloat($stockValueInput.val()).toFixed(2) &&
						parseInt(prdct.Type) === parseInt($stockTypeInput.val())
					) {
						return true;
					} else {
						return false;
					}
				}).length === 0
			) {
				// Closing the modal.
				$stockEditionModal.modal('close');

				// Adding a new stock.
				addNewStock({
					VariantID: 0,
					Value: $stockValueInput.val(),
					Type: $stockTypeInput.val(),
					Price: $stockPriceInput.val(),
					CurrentIndex: -1,
					FeaturedVariant: false,
					DeletedFlavors: [],
					Flavors: [],
					Tags: []
				});

				// Clearing the inputs.
				$stockValueInput.val('');
				$stockPriceInput.val('');
			} else {
				alert('هناك منتوج بنفس القياس');
			}
		});

		// Handeling the delete event.
		$('#product-delete-btn').on('click', function () {
			if (confirm('هل تريد حقًا حذف هذا المنتوج؟')) {
				$.ajax({
					url: '/dashboard/products',
					type: 'DELETE',
					data: { ID: Product.ID },
					success: function () {
						location.reload();
					}
				});
			}
		});

		// Nutrition facts preview.
		$productEditionNutritionInfo.on('change', function () {
			$('.nutrition-facts-edition-preview img').attr('src', $(this).val());

			if (
				$('.nutrition-facts-edition-preview img').on('error', function () {
					$('.nutrition-facts-edition-preview img').attr(
						'src',
						'/assets/img/backgrounds/placeholder.jpg'
					);
				})
			);
		});

		function updateUI() {
			// Updating the stock count.
			$('#stock-edition-count').text(
				Product.Stock.reduce(function (total, stock) {
					return total + helper.calculateStockQuantity(stock);
				}, 0)
			);

			// Clearing the old output.
			$stockEditionList.empty();

			// Updating the stock list.
			Product.Stock.forEach(function (stock, index) {
				var stockFlavors = '';

				$.each(stock.Flavors, function (index, flavor) {
					var flavorsDropDown = '';

					$.each(flavors, function (index, flv) {
						flavorsDropDown +=
							'<option value="' +
							flv.FlavorID +
							'" ' +
							(flv.FlavorID === flavor.FlavorID ? 'selected' : '') +
							' ' +
							(helper.isFlavorAllowed(stock.Flavors, flv.FlavorID)
								? ''
								: 'disabled') +
							'>' +
							flv.FlavorName +
							'</option>';
					});

					stockFlavors +=
						'\
      <li data-flavor-index="' +
						index +
						'" class="stock-edition-flavor-entry ' +
						(index === stock.CurrentIndex ? 'active' : '') +
						'">\
        <div class="collapsible-header">\
          <span class="valign-wrapper">\
            <i class="fas fa-trash stock-edition-flavor-remove-btn"></i>\
          </span>\
          <span class="valign-wrapper">\
          ' +
						flavor.Quantity +
						' &nbsp; <b>الكمية</b> <i class="material-icons">inbox</i>\
          </span >\
          <span class="valign-wrapper">\
          ' +
						helper.getFlavorNameFromID(flavor.FlavorID) +
						' &nbsp; <b>النكهة</b> <i class="material-icons">local_drink</i>\
          </span >\
        </div >\
        <div class="collapsible-body">\
          <div class="row">\
            <div class="col s6 stock-edition-entry-variant-image-preview">\
              <img src="/assets/img/backgrounds/placeholder.jpg">\
            </div>\
            <div class="col s6">\
              <div class="row">\
                <div class="input-field col s12">\
                  <select name="stock-edition-entry-flavor" ' +
						(flavor.VariantID ? 'disabled' : '') +
						'>\
                    ' +
						flavorsDropDown +
						'\
                  </select >\
                  <label>النكهة</label>\
                </div >\
              </div >\
              <div class="row">\
                <div class="input-field col s12 right-align">\
                  <label>الكمية</label>\
                    <input min="0" name="stock-edition-entry-quantity" type="number" value="' +
						flavor.Quantity +
						'" class="validate right-align" required>\
                  </label>\
                </div>\
              </div>\
            </div>\
          </div>\
          <div class="row ">\
            <div class="input-field col s12 stock-edition-entry-variant-image-wrapper">\
              <label>صورة المنتوج</label>\
              <input type="url" name="stock-edition-entry-variant-image" class="validate" value="' +
						flavor.VariantImage +
						'" required>\
            </div>\
          </div>\
        </div>\
      </li>\
    ';
				});

				$stockEditionList.append(
					'\
    <li data-id="' +
					index +
					'" class="stock-edition-entry ' +
					(index === currentIndex ? 'active' : '') +
					'">\
      <div class="collapsible-header stock-edition-header">\
        <span class="valign-wrapper">\
        <i class="fas fa-trash stock-edition-remove-btn"></i>\
          <i class="fas fa-star stock-edition-feature-btn ' +
					(stock.FeaturedVariant ? 'featured' : '') +
					'"></i>\
        </span>\
        <span class="valign-wrapper">\
        ' +
					helper.calculateStockQuantity(stock) +
					'&nbsp; <b>الكمية</b> <i class="material-icons">inbox</i> \
        </span>\
        <span class="valign-wrapper">\
        ' +
					helper.formatPrice(stock.Price) +
					'&nbsp; <b>السعر</b> <i class="material-icons">attach_money</i> \
        </span>\
        <span class="valign-wrapper">\
						' +
					helper.formatMeasurement(stock.Value, stock.Type) +
					'&nbsp; <b>القياس</b> <i class="fas fa-balance-scale"></i> \
        </span>\
      </div>\
      <div class="collapsible-body">\
        <div class="row">\
          <div class="col s12">\
							<div class="row"> \
							<div class="input-field col s12"> \
								<select name="stock-edition-entry-type"> \
									<option ' +
					(stock.Type === 1 ? 'selected' : '') +
					' value="1">الكيلوغرام</option> \
									<option ' +
					(stock.Type === 2 ? 'selected' : '') +
					' value="2">الحصة</option> \
									<option ' +
					(stock.Type === 3 ? 'selected' : '') +
					' value="3">القطعة</option> \
									<option ' +
					(stock.Type === 4 ? 'selected' : '') +
					' value="4">الحزمة</option> \
									<option ' +
					(stock.Type === 5 ? 'selected' : '') +
					' value="5">الملعقة</option> \
								</select> \
								<label>وحدة قياس</label> \
							</div> \
						</div> \
						<div class="row">\
							<div class="col s12 right-align">\
								<label>القياس\
									<input min="0" name="stock-edition-entry-value" step="0.001" type="number" value="' +
					stock.Value +
					'" class="validate right-align" required>\
								</label>\
							</div>\
						</div>\
            <div class="row">\
              <div class="col s12 right-align">\
                <label>السعر <small class="grey-text">&rlm;(درهم)&rlm;</small>\
                  <input min="0" name="stock-edition-entry-price" type="number" step="0.01" value="' +
					stock.Price +
					'" class="validate right-align" required>\
                </label>\
              </div>\
						</div>\
						<div class="row"> \
							<div class="input-field col s12"> \
								<p class="grey-text right-align">الكلمات المرتبطة</p> \
								<div name="stock-edition-entry-tags" class="chips chips-placeholder chips-initial"></div> \
							</div> \
						</div> \
            <div class="row">\
              <div class="col s8 offset-s2">\
                <button class="btn btn-block btn-large waves-effect waves-light stock-edition-flavor-add-btn">إضافة نكهة للمنتوج</button>\
                </label>\
              </div>\
            </div>\
          </div>\
          <div class="row">\
            <div class="col s12 stock-edition-entry-flavor-list">\
              <h5 class="right-align">[ ' +
					stock.Flavors.length +
					' ] النكهات</h5>\
              <ul class="collapsible">\
                ' +
					stockFlavors +
					'\
              </ul>\
            </div>\
          </div>\
        </div>\
      </div>\
    </li>'
				);
			});

			// Adding the image preview event handeler.
			$('#stock-edition-list [name=stock-edition-entry-variant-image]').on(
				'change',
				function () {
					updateStockCreationPreviews($(this));
				}
			);

			// Displaying the product images' previews.
			$('#stock-edition-list [name=stock-edition-entry-variant-image]').trigger(
				'change'
			);

			// Adding the stock remove click event.
			$('#stock-edition-list .stock-edition-remove-btn').on('click', function (
				e
			) {
				// Stopping event propagation.
				e.stopPropagation();

				// Getting the stock's index.
				var index = $(this)
					.closest('li')
					.data('id');

				// Removing the stock.
				removeStock(index);
			});

			// Adding the stock featuring click event.
			$('#stock-edition-list .stock-edition-feature-btn').on('click', function (
				e
			) {
				// Stopping event propagation.
				e.stopPropagation();

				// Getting the stock's index.
				var index = $(this)
					.closest('li')
					.data('id');

				// Removing the stock.
				setFeaturedStock(index);
			});

			// Adding the flavor addition event.
			$('.stock-edition-flavor-add-btn').on('click', function () {
				// Getting the stock's index.
				var index = $(this)
					.closest('li')
					.data('id');

				// Adding a flavor.
				addFlavor(index, {
					Quantity: 1,
					FlavorID: flavors[0].FlavorID,
					VariantImage: ''
				});
			});

			// Adding the flavor update event.
			$('.stock-edition-entry .stock-edition-flavor-entry select').on(
				'change',
				function (e) {
					// Getting the stock's index.
					var index = $(this)
						.closest('.stock-edition-entry')
						.data('id'),
						flavorIndex = $(this)
							.closest('li')
							.data('flavor-index'),
						newFlavorId = parseInt($(e.target).val());

					// Updating the flavor.
					Product.Stock[index].Flavors[flavorIndex].FlavorID = newFlavorId;

					// Updating the UI.
					updateUI();
				}
			);

			// Adding the flavor removal event.
			$('.stock-edition-flavor-remove-btn').on('click', function (e) {
				// Stopping event propagation.
				e.stopPropagation();

				// Getting the stock's index.
				var index = $(this)
					.closest('.stock-edition-entry')
					.data('id'),
					flavorIndex = $(this)
						.closest('li')
						.data('flavor-index');

				// Adding a flavor.
				removeFlavor(index, flavorIndex);
			});

			// Adding the stock update event for price and weight inputs.
			$(
				'#stock-edition-list input[name=stock-edition-entry-price], #stock-edition-list input[name=stock-edition-entry-value], #stock-edition-list select[name=stock-edition-entry-type]'
			).on('change', function (e) {
				// Getting the stock's index.
				var index = $(this)
					.closest('li')
					.data('id');

				// Updaing the stock.
				if ($(this).attr('name') === 'stock-edition-entry-value') {
					Product.Stock[index].Value = $(this).val();
				} else if ($(this).attr('name') === 'stock-edition-entry-type') {
					Product.Stock[index].Type = $(this).val();
				} else if ($(this).attr('name') === 'stock-edition-entry-price') {
					Product.Stock[index].Price = $(this).val();
				}

				// Updating the UI.
				updateUI();
			});

			// Adding the quantity update event.
			$('#stock-edition-list [name=stock-edition-entry-quantity]').on(
				'change',
				function (e) {
					// Getting the stock's index.
					var index = $(this)
						.closest('.stock-edition-entry')
						.data('id'),
						flavorIndex = $(this)
							.closest('li')
							.data('flavor-index'),
						quantity = parseInt($(e.target).val());

					// Updating the quantity.
					Product.Stock[index].Flavors[flavorIndex].Quantity = quantity;

					// Updating the UI.
					updateUI();
				}
			);

			// Variants' image preview.
			$('[name=stock-edition-entry-variant-image]').on('change', function (e) {
				// Getting the stock's index.
				var index = $(this)
					.closest('.stock-edition-entry')
					.data('id'),
					flavorIndex = $(this)
						.closest('li')
						.data('flavor-index'),
					image = $(e.target).val();

				// Updating the image.
				Product.Stock[index].Flavors[flavorIndex].VariantImage = image;

				// Updating the UI.
				updateUI();
			});

			// Adding the index update event.
			$('#stock-edition-list .stock-edition-header').on('click', function () {
				if (
					!$(this)
						.parent()
						.hasClass('active')
				) {
					currentIndex = $(this)
						.parent()
						.data('id');
				} else {
					currentIndex = -1;
				}
			});

			// Adding the index update event.
			$(
				'.stock-edition-entry .stock-edition-flavor-entry .collapsible-header'
			).on('click', function () {
				// Getting the stock's index.
				var index = $(this)
					.closest('.stock-edition-entry')
					.data('id');

				if (
					!$(this)
						.parent()
						.hasClass('active')
				) {
					Product.Stock[index].CurrentIndex = $(this)
						.parent()
						.data('flavor-index');
				} else {
					Product.Stock[index].CurrentIndex = -1;
				}
			});

			// Re-initializing the collapsibles.
			$('#stock-edition-list, #stock-edition-list .collapsible').collapsible();

			// Re-initializing the chips input.
			$.each($('#stock-edition-list div.chips'), function (index, chip) {
				$(chip).chips({
					data: $.map(Product.Stock[index].Tags, function (tag) {
						return { tag };
					}),
					placeholder: 'كلمة مرتبطة',
					secondaryPlaceholder: '+ كلمة مرتبطة',
					onChipAdd: function () {
						// Updating the tags.
						Product.Stock[index].Tags = $.map($(this)[0].chipsData, function (
							tag
						) {
							return tag['tag'].indexOf(',') === -1 ? tag['tag'] : null;
						});

						// Updating the UI.
						updateUI();
					},
					onChipDelete: function () {
						// Updating the tags.
						Product.Stock[index].Tags = $.map($(this)[0].chipsData, function (
							tag
						) {
							return tag['tag'].indexOf(',') === -1 ? tag['tag'] : null;
						});
					}
				});
			});

			// Re-initializing the dropdowns.
			$(
				'#product-edition-brand, #product-edition-category, #stock-edition-list select'
			).formSelect();
		}
	})();

	// Product deletion.
	(function () {
		$('.dashboard-products .btn-restore').on('click', function () {
			var data = {
				productId: $(this)
					.closest('.collection-item')
					.find('[name=product-id]')
					.val(),
				variantId: $(this)
					.closest('.collection-item')
					.find('[name=variant-id]')
					.val(),
				flavorId: $(this)
					.closest('.collection-item')
					.find('[name=flavor-id]')
					.val()
			};

			$.ajax({
				url: '/dashboard/products/restore',
				type: 'PUT',
				data: data,
				success: function () {
					location.reload();
				}
			});
		});
	})();

	// Helper functions.
	var helper = {
		formatMeasurement: function (value, type) {
			var formatedMeasurement = '';

			switch (parseInt(type)) {
				case 1: {
					formatedMeasurement =
						parseInt(value) >= 1 ? value + ' كلغ' : value * 1000 + ' غرام';
					break;
				}
				case 2: {
					formatedMeasurement =
						parseInt(value) > 1 ? value + ' حصص' : value + ' حصة';
					break;
				}
				case 3: {
					formatedMeasurement =
						parseInt(value) > 1 ? value + ' قطع' : value + ' قطعة';
					break;
				}
				case 4: {
					formatedMeasurement =
						parseInt(value) > 1 ? value + ' حزم' : value + ' حزمة';
					break;
				}
				case 5: {
					formatedMeasurement =
						parseInt(value) > 1 ? value + ' ملاعق' : value + ' ملعقة';
					break;
				}
			}

			return formatedMeasurement;
		},
		formatPrice: function (price) {
			return new Intl.NumberFormat('ar-MA', {
				style: 'currency',
				currency: 'MAD'
			}).format(price);
		},
		calculateStockQuantity: function (stock) {
			return stock.Flavors.reduce(function (total, flv) {
				return total + flv.Quantity;
			}, 0);
		},
		getFlavorNameFromID: function (flavorId) {
			for (var i = 0; i < flavors.length; i++) {
				if (flavors[i].FlavorID == flavorId) {
					return flavors[i].FlavorName;
				}
			}

			return 'Unflavored';
		},
		groupStock: function (stock, flavors) {
			$.each(stock, function (i, s) {
				s['FeaturedVariant'] = s['FeaturedVariant']['data'][0] == 1 ? true : 0;
				s['CurrentIndex'] = s['CurrentIndex'] = -1;
				s['Value'] = s['VariantValue'];
				s['Type'] = s['VariantType'];
				s['DeletedFlavors'] = [];
				s['Flavors'] = [];
				s['Tags'] =
					s['Tags'] != null && s['Tags'].length > 0 ? s['Tags'].split(',') : [];

				$.each(flavors, function (j, f) {
					if (f['VariantID'] === s['VariantID']) {
						s['Flavors'].push(f);
					}
				});
			});

			return stock.slice();
		},
		isFlavorAllowed: function (flavors, flavor) {
			var flavorsList = $.map(flavors, function (flv) {
				return flv['FlavorID'];
			});

			return flavorsList.indexOf(flavor) === -1;
		}
	};
});
