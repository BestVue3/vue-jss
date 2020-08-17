import type {
  Jss,
  SheetsRegistry,
  SheetsManager,
  Rule,
  CreateGenerateIdOptions,
  GenerateId
} from 'jss'
// import type {Node} from 'react'
// import type {Theming} from 'theming'

export interface Managers {[key: number]: SheetsManager}

export interface Context {
  jss?: Jss,
  registry?: SheetsRegistry,
  managers?: Managers,
  id?: CreateGenerateIdOptions,
  classNamePrefix?: string,
  disableStylesGeneration?: boolean,
  media?: string,
  generateId?: GenerateId
}

export type Classes = {[key: string]: string}

export type InnerProps = {
  children?: Node,
  classes: Classes
}

export type DynamicRules = {
  [key: string]: Rule
}

export type StaticStyle = {}
export type DynamicStyle<Theme> = ({theme: Theme}: any) => StaticStyle

export type StaticStyles = {[key: string]: StaticStyle}

export type ThemedStyles<Theme> = (theme: Theme) => StaticStyle | DynamicStyle<Theme>

export type Styles<Theme> = StaticStyles | ThemedStyles<Theme>
