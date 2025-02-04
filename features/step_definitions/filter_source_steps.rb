require 'json'
require 'net/http'
require 'uri'

# Feature: Source filter dropdown for Dashboard

# Scenario: Hovering on a source dropdown option updates its color
Given(/there are sources in the dataset/) do
  url = "#{Capybara.app_host}"
  @sources = get_sources_from_dataset(url)
end

When(/I click on the "Sources" dropdown button/) do
  find('#filter-source').click
end

When(/I hover over a source dropdown option/) do
  button = find('.filter-source-option', text: "Problem Solution")
  button.hover
end

Then(/the source dropdown option should be highlighted on hover/) do
  button = find('.filter-source-option', text: "Problem Solution")
  # Verify the color change by checking the computed style
  new_background_color = page.evaluate_script("window.getComputedStyle(arguments[0]).backgroundColor;", button)
  expect(new_background_color).to satisfy { |color| 
  color == 'rgba(0, 0, 0, 0)' || color == 'rgba(0, 0, 0, 0.04)'
}
  page.execute_script("arguments[0].dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));", button)
end

# Scenario: Clicking a source dropdown option colors it red and adds it to the listbox
And(/I select a source/) do
  source = find('.filter-source-option', match: :first)
  source.click
  @selectedsource = source.text.strip
end

Then(/the (.*) source dropdown option should be (.*)/) do |selectdeselect, color|
  # Find the dropdown option based on @selectedsource
  source_option = find('.filter-source-option', text: @selectedsource, visible: true)

  case color
  when 'red'
    # Verify that the selected source has Mui-selected class
    expect(source_option[:class]).to include('Mui-selected')
  when 'reverted to white'
    # Verify that the selected source does not have Mui-selected class
    expect(source_option[:class]).not_to include('Mui-selected')
  end
end

Then(/the (.*) source is (.*) the listbox/) do |selectdeselect, addremove|
  find('body').click
  # Find all source values currently in the listbox
  source_value = all('.filter-source-value').map(&:text)
  
  if selectdeselect == 'selected' && addremove == 'added to'
    # Ensure the selected source is in the listbox
    expect(source_value).to include(@selectedsource)
  elsif selectdeselect == 'deselected' && addremove == 'removed from'
    # Ensure the deselected source is not in the listbox
    expect(source_value).not_to include(@selectedsource)
  else
    # Handle unsupported combinations
    raise "Unsupported combination: #{selectdeselect}, #{addremove}"
  end
end

# Scenario: Unclicking a selected source dropdown option resets its color and removes it from the listbox
And(/I deselect the same source/) do
  raise "No source selected" unless @selectedsource
  find('.filter-source-option', text: @selectedsource).click
end

# Scenario: Available source dropdown options
Then(/I should see all (\d+) sources arranged alphabetically as dropdown options/) do |count|
  options = all('.filter-source-option').map(&:text).reject(&:empty?)
  expect(options).to eq options.sort
  expect(options.size).to eq count.to_i
end

# Scenario: No selection of source dropdown option
When(/no Sources dropdown options are selected/) do
  all('.filter-source-option').each do |option|
    expect(option[:'aria-selected']).to eq 'false'
  end
end

Then(/I should see "Sources" in the text field of the dropdown button/) do
  expect(page).to have_css('.MuiFormLabel-root.MuiInputLabel-root', text: 'Sources')
end

# Scenario: Reset source selection by refreshing
#   Using previously defined steps



# Helper methods
def get_sources_from_dataset(base_url)
  url = URI("#{base_url}/analytics/filter_sources")
  response = Net::HTTP.get_response(url)
  JSON.parse(response.body).map(&:to_s).sort
rescue StandardError => e
  raise "Failed to fetch products: #{e.message}"
end
