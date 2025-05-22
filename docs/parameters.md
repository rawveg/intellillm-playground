# Prompt Parameters

[← Back to Main README](../README.md) | [Features](./features.md) | [Installation](./installation.md) | [File Attachments](./file-attachments.md) | [Web Search](./web-search.md) | [API Reference](./api-reference.md) | [Contributing](./contributing.md)

---

Prompt parameters transform your templates into interactive mini-applications. Use parameters in your prompts with the `{{ParameterName}}` syntax.

## Basic Usage

Parameters can be added to any part of your prompt using double curly braces:

```markdown
---
{
  "model": "anthropic/claude-2",
  "temperature": 0.7
}
---
Tell me about the history of {{City}} in {{Country}}.
```

When you run a prompt containing parameters:
1. A modal appears for you to input values for each parameter
2. Previously used values are remembered for convenience
3. The original prompt template remains unchanged for future use

## Supported Parameter Field Types

The following parameter field types are fully implemented and available for use in prompt templates:

- **text**: Single-line text input (default)
  ```markdown
  {{Name}}  <!-- Default is text type -->
  {{Name|text}}
  ```

- **multiline**: Multi-line textarea input
  ```markdown
  {{Description|multiline}}
  ```

- **number**: Numeric input (supports min/max validation)
  ```markdown
  {{Age|number}}
  ```

- **email**: Email address input (with validation)
  ```markdown
  {{EmailAddress|email}}
  ```

- **url**: URL input (with validation)
  ```markdown
  {{Website|url}}
  ```

- **date**: Date picker
  ```markdown
  {{BirthDate|date}}
  ```

- **time**: Time picker
  ```markdown
  {{MeetingTime|time}}
  ```

- **month**: Month picker (supports formats: full, short, numeric, numeric-dd)
  ```markdown
  {{Month|month}}                  <!-- Default format (full) -->
  {{Month|month-full}}             <!-- "January", "February", etc. -->
  {{Month|month-short}}            <!-- "Jan", "Feb", etc. -->
  {{Month|month-numeric}}          <!-- "1", "2", etc. -->
  {{Month|month-numeric-dd}}       <!-- "01", "02", etc. -->
  ```

- **year**: Year picker (supports default, past-only, future-only, custom ranges)
  ```markdown
  {{Year|year}}                   <!-- Default range (5 years back, 5 years forward) -->
  {{Year|year-last-10}}           <!-- Last 10 years including current year -->
  {{Year|year-next-10}}           <!-- Next 10 years including current year -->
  {{Year|year:10-2}}              <!-- Custom range (10 years back, 2 years forward) -->
  ```

- **checkbox**: Boolean toggle (or custom true/false options)
  ```markdown
  {{AgreeToTerms|checkbox}}                     <!-- Default labels (Yes/No) -->
  {{AgreeToTerms|checkbox:Agree,Disagree}}      <!-- Custom labels -->
  ```

- **select**: Dropdown single selection (with custom options)
  ```markdown
  {{City|select:Paris,London,Tokyo,New York}}
  ```

- **multiselect**: Checkbox group for multiple selections
  ```markdown
  {{Interests|multiselect:Sports,Music,Art,Travel,Food}}
  ```

- **radio**: Radio button group (single selection)
  ```markdown
  {{Size|radio:Small,Medium,Large}}
  ```

- **file**: File parameter that allows embedding text file contents in prompts
  ```markdown
  {{TextData|file}}
  ```

## Parameter Validation

You can add validation rules to parameters using the syntax `{{ParameterName|fieldType|validationType:rules}}`. All validation is optional but provides better user experience.

```markdown
{{Name|text|string:min-3,max-100}}    <!-- Text with length between 3 and 100 characters -->
{{Age|number|number:min-18,max-65}}   <!-- Number between 18 and 65 -->
{{Username|text|regexp:^[a-zA-Z0-9]+$}}  <!-- Text matching a regular expression pattern -->
```

Validation types:
- `string`: Validates text length with `min-X` and `max-X` rules
- `number`: Validates numeric values with `min-X` and `max-X` rules
- `regexp`: Validates against a regular expression pattern

If validation fails, the user will see an error message and cannot submit the form until all validations pass.

## Default Values

You can specify default values for parameters using the `default:` syntax:

```markdown
{{Name|default:John}}                  <!-- Text field with default value "John" -->
{{Age|number|default:30}}             <!-- Number field with default value 30 -->
{{Date|date|default:current}}         <!-- Date field with current date as default -->
{{Time|time|default:current}}         <!-- Time field with current time as default -->
{{Year|year|default:current}}         <!-- Year field with current year as default -->
{{Month|month|default:current}}       <!-- Month field with current month as default -->
{{Interests|multiselect:Sports,Music,Art|default:Sports,Art}}  <!-- Multiselect with multiple default values -->
```

Special default values:
- `current`: For date, time, year, and month fields, sets the default to the current value

Default values can be combined with field types and validation rules in any order:

```markdown
{{Username|text|string:min-3,max-20|default:user123}}  <!-- With validation -->
{{City|select:Paris,London,Tokyo|default:Paris}}       <!-- With options -->
{{Name|default:Tim}}                                   <!-- Simple default -->
{{Name|text|default:Tim}}                              <!-- With field type -->
{{Name|text|string|default:Tim}}                       <!-- With validation type -->
{{Name|text|string:min-3,max-100|default:Tim}}         <!-- With validation rules -->
```

## Guidelines & Limitations

### Recommendations

- **Maximum Parameters**: Limit to 12 parameters per prompt (UI switches to multi-column for >5)
- **Required Fields**: All parameters are required and must have values before execution
- **UI Considerations**: Multiselect fields render as checkbox groups for better usability

### Restrictions

- **Nested Parameters**: Not supported and will result in an error

```markdown
# ✅ Good:
{{Param|select:Option1,Option2}}
# ❌ Not allowed:
{{Outer|{{Inner}}}}
```

## Examples

### Basic Example

```markdown
---
{
  "model": "anthropic/claude-2",
  "temperature": 0.7
}
---
Tell me about the history of {{City}} in {{Country}}.

## System Prompt
You are a historian specializing in the history of {{City}}, {{Country}}.
```

### Complex Example with Multiple Parameter Types

```markdown
---
{
  "model": "anthropic/claude-2",
  "temperature": 0.7
}
---

Create a travel itinerary for {{Name}} visiting {{City|select:Paris,London,Tokyo,New York}} in {{Month|month}} {{Year|year}}.

Include the following activities: {{Activities|multiselect:Museums,Restaurants,Parks,Shopping,Nightlife}} <!-- Renders as a checkbox group for better usability -->

## System Prompt
You are a travel expert specializing in creating personalized itineraries. The traveler's name is {{Name}} and they are {{Age|number}} years old.
```
