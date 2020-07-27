// @flow
import warning from 'tiny-warning'
import { getDynamicStyles, StyleSheetFactoryOptions } from 'jss'
import type { StyleSheet } from 'jss'
import type { Context, DynamicRules, Styles } from '../types'
import { getManager } from './managers'
import defaultJss from '../jss'
import { addMeta, getMeta } from './sheetsMeta'

interface Options<Theme> {
  context: Context
  theme: Theme
  name?: string
  index: number
  styles: Styles<Theme>
  sheetOptions: StyleSheetFactoryOptions
}

const getStyles = <Theme>(options: Options<Theme>) => {
  const { styles } = options
  if (typeof styles !== 'function') {
    return styles
  }

  warning(
    styles.length !== 0,
    `[JSS] <${
      options.name || 'Hook'
    } />'s styles function doesn't rely on the "theme" argument. We recommend declaring styles as an object instead.`,
  )

  return styles(options.theme)
}

function getSheetOptions<Theme>(options: Options<Theme>, link: boolean) {
  let minify
  if (options.context.id && options.context.id.minify != null) {
    minify = options.context.id.minify
  }

  let classNamePrefix = options.context.classNamePrefix || ''
  if (options.name && !minify) {
    classNamePrefix += `${options.name.replace(/\s/g, '-')}-`
  }

  let meta = ''
  if (options.name) meta = `${options.name}, `
  meta += typeof options.styles === 'function' ? 'Themed' : 'Unthemed'

  return {
    ...options.sheetOptions,
    index: options.index,
    meta,
    classNamePrefix,
    link,
    generateId: options.sheetOptions.generateId || options.context.generateId,
  }
}

export const createStyleSheet = <Theme>(options: Options<Theme>) => {
  if (options.context.disableStylesGeneration) {
    return undefined
  }

  const manager = getManager(options.context, options.index)
  const existingSheet = manager.get(options.theme)

  if (existingSheet) {
    return existingSheet
  }

  const jss = options.context.jss || defaultJss
  const styles = getStyles(options)
  const dynamicStyles: any = getDynamicStyles(styles)
  const sheet = jss.createStyleSheet(
    styles,
    getSheetOptions(options, dynamicStyles !== null),
  )

  addMeta(sheet, {
    dynamicStyles,
    styles,
  })

  manager.add(options.theme, sheet)

  return sheet
}

export const removeDynamicRules = (sheet: StyleSheet, rules: DynamicRules) => {
  // Loop over each dynamic rule and remove the dynamic rule
  // We can't just remove the whole sheet as this has all of the rules for every component instance
  for (const key in rules) {
    sheet.deleteRule(rules[key] as any)
  }
}

export const updateDynamicRules = (
  data: any,
  sheet: StyleSheet,
  rules: DynamicRules,
) => {
  // Loop over each dynamic rule and update it
  // We can't just update the whole sheet as this has all of the rules for every component instance
  for (const key in rules) {
    ;(sheet as any).updateOne(rules[key], data)
  }
  // sheet.update(data)
}

export const addDynamicRules = (
  // StyleSheet does not contain rules
  sheet: any,
  data: any,
): DynamicRules | null => {
  const meta = getMeta(sheet)

  if (!meta) {
    return null
  }

  const rules: DynamicRules = {}

  // Loop over each dynamic rule and add it to the stylesheet
  for (const key in meta.dynamicStyles) {
    const initialRuleCount = sheet.rules.index.length
    const originalRule = sheet.addRule(key, meta.dynamicStyles[key])

    // Loop through all created rules, fixes updating dynamic rules
    for (let i = initialRuleCount; i < sheet.rules.index.length; i++) {
      const rule = sheet.rules.index[i]
      sheet.updateOne(rule, data)

      // If it's the original rule, we need to add it by the correct key so the hook and hoc
      // can correctly concat the dynamic class with the static one
      rules[originalRule === rule ? key : rule.key] = rule
    }
  }

  return rules
}
