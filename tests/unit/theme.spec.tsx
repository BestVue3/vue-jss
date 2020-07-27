/* eslint-disable react/prop-types */

import {
  createUseStyles,
  createTheming,
  ThemeProvider,
  JssProvider,
  useTheme,
  SheetsRegistry,
} from '../../lib'
import { isRef, h, nextTick, defineComponent } from 'vue'
import { mount } from '@vue/test-utils'

const createStyledComponent = (styles: any, options: any = {}) => {
  const useStyles = createUseStyles(styles, options)
  const Comp = defineComponent({
    props: ['theme', 'getTheme', 'backgroundColor'],
    setup(props: any) {
      useStyles(props)

      const theme =
        props.theme ||
        (options.theming ? options.theming.useTheme() : useTheme())

      if (props.getTheme) props.getTheme(isRef(theme) ? theme.value : theme)
      return () => null
    },
  })
  // Comp.displayName = options.name
  return Comp
}

describe('React-JSS: theming useStyles()', () => {
  const themedStaticStyles = (theme: any) => ({
    rule: {
      color: theme.color,
    },
  })
  const themedDynamicStyles = (theme: any) => ({
    rule: {
      color: theme.color,
      backgroundColor: (props: any) => props.backgroundColor,
    },
  })

  // need to make it new object every test
  // if not sheet manager will cache them
  let themeA: any
  let themeB: any

  beforeEach(() => {
    themeA = { color: '#aaa' }
    themeB = { color: '#bbb' }
  })

  const ThemedStaticComponent = createStyledComponent(themedStaticStyles)
  const ThemedDynamicComponent = createStyledComponent(themedDynamicStyles)

  describe('injecting the theme', () => {
    let themeFromUseTheme: any
    let themeFromStylesFn: any

    // const defaultProps = {
    //   getTheme: (theme: any) => {
    //     themeFromUseTheme = theme
    //   }
    // }

    const getTheme = (theme: any) => {
      themeFromUseTheme = theme
    }

    beforeEach(() => {
      themeFromUseTheme = {}
      themeFromStylesFn = {}
    })

    it('should subscribe theme with useTheme, but not with useStyles', () => {
      const StyledComponent = createStyledComponent({})
      // StyledComponent.defaultProps = defaultProps
      mount(() => (
        <ThemeProvider theme={themeA}>
          <StyledComponent getTheme={getTheme} />
        </ThemeProvider>
      ))
      expect(themeFromUseTheme).toBe(themeA)
      expect(themeFromStylesFn).toEqual({})
    })

    it('should warn when styles function has no arguments', () => {})

    it('should subscribe theme with useTheme and with useStyles', () => {
      const StyledComponent = createStyledComponent((theme: any) => {
        themeFromStylesFn = theme
        return {}
      })
      // StyledComponent.defaultProps = defaultProps
      mount(() => (
        <ThemeProvider theme={themeA}>
          <StyledComponent getTheme={getTheme} />
        </ThemeProvider>
      ))
      expect(themeFromUseTheme).toBe(themeA)
      expect(themeFromStylesFn).toEqual(themeA)
    })

    it('should use the theme from props instead of the one from provider', () => {
      const StyledComponent = createStyledComponent({})
      mount(() => (
        <ThemeProvider theme={themeA}>
          <StyledComponent theme={themeB} getTheme={getTheme} />
        </ThemeProvider>
      ))
      expect(themeFromUseTheme).toEqual(themeB)
    })
  })

  it('should have correct meta attribute for themed styles', () => {
    let sheet: any
    const generateId = (rule: any, s: any) => {
      sheet = s
      return rule.key
    }
    mount(() => (
      <JssProvider generateId={generateId}>
        <ThemeProvider theme={themeA}>
          <ThemedStaticComponent />
        </ThemeProvider>
      </JssProvider>
    ))

    expect(sheet.options.meta.includes('Themed')).toBe(true)
  })

  it('one themed instance wo/ dynamic props = 1 style', () => {
    const registry = new SheetsRegistry()
    mount(() => (
      <JssProvider registry={registry}>
        <ThemeProvider theme={themeA}>
          <ThemedStaticComponent />
        </ThemeProvider>
      </JssProvider>
    ))
    expect((registry as any).registry.length).toEqual(1)
  })

  it('one themed instance w/ dynamic props = 2 styles', () => {
    const registry: any = new SheetsRegistry()
    mount(() => (
      <JssProvider registry={registry}>
        <ThemeProvider theme={themeA}>
          <ThemedDynamicComponent backgroundColor="#fff" />
        </ThemeProvider>
      </JssProvider>
    ))

    expect(registry.registry.length).toEqual(1)
  })

  it('one themed instance wo/ = 1 style, theme update = 1 style', () => {
    const registry: any = new SheetsRegistry()

    const Container = ({ theme }: any) =>
      h(ThemeProvider, { theme }, () =>
        h(JssProvider, { registry }, () => h(ThemedStaticComponent)),
      )

    // (
    //   <ThemeProvider theme={props.theme}>
    //     <JssProvider registry={registry}>
    //       <ThemedStaticComponent />
    //     </JssProvider>
    //   </ThemeProvider>
    // )

    const renderer = mount(Container, {
      props: {
        theme: themeA,
      },
    })

    expect(registry.registry.length).toEqual(1)

    renderer.setProps({
      theme: themeB,
    })

    return nextTick(() => {
      // TODO: to be fixed
      expect(registry.registry[0].attached).toBe(false)
      expect(registry.registry.length).toEqual(2)
    })
  })

  it('one themed instance w/ dynamic props = 2 styles, theme update = 2 styles', () => {
    const registry: any = new SheetsRegistry()

    const Container = ({ theme }: any) => (
      <ThemeProvider theme={theme}>
        <JssProvider registry={registry}>
          <ThemedDynamicComponent backgroundColor="#fff" />
        </JssProvider>
      </ThemeProvider>
    )

    // h(
    //   ThemeProvider,
    //   { theme },
    //   () => h(JssProvider, { registry }, () => h(ThemedDynamicComponent, { backgroundColor: '#fff' }))
    // )

    const renderer = mount(Container, {
      props: {
        theme: themeA,
      },
    })

    expect(registry.registry.length).toEqual(1)

    renderer.setProps({
      theme: themeB,
    })

    return nextTick(() => {
      expect(registry.registry[0].attached).toBe(false)
      expect(registry.registry.length).toEqual(2)
    })
  })

  it('two themed instances wo/ dynamic props w/ same theme = 1 style', () => {
    const registry: any = new SheetsRegistry()
    mount(() => (
      <JssProvider registry={registry}>
        <ThemeProvider theme={themeA}>
          <ThemedStaticComponent />
          <ThemedStaticComponent />
        </ThemeProvider>
      </JssProvider>
    ))

    expect(registry.registry.length).toEqual(1)
  })

  it('two themed instances w/ dynamic props w/ same theme = 3 styles', () => {
    const registry: any = new SheetsRegistry()
    mount(() => (
      <JssProvider registry={registry}>
        <ThemeProvider theme={themeA}>
          <ThemedDynamicComponent backgroundColor="#fff" />
          <ThemedDynamicComponent backgroundColor="#fff" />
        </ThemeProvider>
      </JssProvider>
    ))

    expect(registry.registry.length).toEqual(1)
  })

  it('two themed instances w/ dynamic props w/ same theme = 3 styles, theme update = 3 styles', () => {
    const registry: any = new SheetsRegistry()
    const Container = ({ theme }: any) =>
      h(ThemeProvider, { theme }, () =>
        h(JssProvider, { registry }, () => [
          h(ThemedDynamicComponent, { backgroundColor: '#fff' }),
          h(ThemedDynamicComponent, { backgroundColor: '#fff' }),
        ]),
      )

    // (
    //   <ThemeProvider theme={theme}>
    //     <JssProvider registry={registry}>
    //       <ThemedDynamicComponent backgroundColor="#fff" />
    //       <ThemedDynamicComponent backgroundColor="#fff" />
    //     </JssProvider>
    //   </ThemeProvider>
    // )

    const renderer = mount(Container, {
      props: {
        theme: themeA,
      },
    })

    expect(registry.registry.length).toEqual(1)

    renderer.setProps({
      theme: themeB,
    })

    return nextTick(() => {
      expect(registry.registry[0].attached).toEqual(false)
      expect(registry.registry.length).toEqual(2)
    })
  })

  it('two themed instances wo/ dynamic props w/ same theme = 1 styles, different theme update = 2 styles', () => {
    const registry: any = new SheetsRegistry()
    const Container = ({ a, b }: any) =>
      h(
        JssProvider,
        {
          registry,
        },
        () => [
          h(ThemeProvider, { theme: a }, () => h(ThemedStaticComponent)),
          h(ThemeProvider, { theme: b }, () => h(ThemedStaticComponent)),
        ],
      )

    // (
    //   <JssProvider registry={registry}>
    //     <ThemeProvider theme={a}>
    //       <ThemedStaticComponent />
    //     </ThemeProvider>
    //     <ThemeProvider theme={b}>
    //       <ThemedStaticComponent />
    //     </ThemeProvider>
    //   </JssProvider>
    // )

    const renderer = mount(Container, {
      props: {
        a: themeA,
        b: themeA,
      },
    })

    expect(registry.registry.length).toEqual(1)

    renderer.setProps({
      a: themeA,
      b: themeB,
    })

    return nextTick(() => {
      expect(registry.registry.length).toEqual(2)
    })
  })

  it('two themed instances w/ dynamic props w/ same theme = 3 styles, different theme update = 4 styles', () => {
    const registry: any = new SheetsRegistry()
    const Container = ({ a, b }: any) =>
      h(
        JssProvider,
        {
          registry,
        },
        () => [
          h(ThemeProvider, { theme: a }, () =>
            h(ThemedDynamicComponent, { backgroundColor: '#ff' }),
          ),
          h(ThemeProvider, { theme: b }, () =>
            h(ThemedDynamicComponent, { backgroundColor: '#ff' }),
          ),
        ],
      )

    // (
    //   <JssProvider registry={registry}>
    //     <ThemeProvider theme={a}>
    //       <ThemedDynamicComponent backgroundColor="#fff" />
    //     </ThemeProvider>
    //     <ThemeProvider theme={b}>
    //       <ThemedDynamicComponent backgroundColor="#fff" />
    //     </ThemeProvider>
    //   </JssProvider>
    // )

    const renderer = mount(Container, {
      props: {
        a: themeA,
        b: themeA,
      },
    })

    expect(registry.registry.length).toEqual(1)

    renderer.setProps({
      a: themeA,
      b: themeB,
    })

    return nextTick(() => {
      expect(registry.registry.length).toEqual(2)
    })
  })

  it('two themed instances wo/ dynamic props w/ different themes = 2 styles, same theme update = 1 style', () => {
    const registry: any = new SheetsRegistry()
    const Container = ({ a, b }: any) =>
      h(
        JssProvider,
        {
          registry,
        },
        () => [
          h(ThemeProvider, { theme: a }, () => h(ThemedStaticComponent)),
          h(ThemeProvider, { theme: b }, () => h(ThemedStaticComponent)),
        ],
      )

    // (
    //   <JssProvider registry={registry}>
    //     <ThemeProvider theme={a}>
    //       <ThemedStaticComponent />
    //     </ThemeProvider>
    //     <ThemeProvider theme={b}>
    //       <ThemedStaticComponent />
    //     </ThemeProvider>
    //   </JssProvider>
    // )

    const renderer = mount(Container, {
      props: {
        a: themeA,
        b: themeB,
      },
    })

    expect(registry.registry.length).toEqual(2)

    renderer.setProps({
      a: themeA,
      b: themeA,
    })

    return nextTick(() => {
      expect(registry.registry[1].attached).toEqual(false)
      expect(registry.registry.length).toEqual(2)
    })
  })

  it('two themed instances w/ dynamic props w/ different themes = 4 styles, same theme update = 3 styles', () => {
    const registry: any = new SheetsRegistry()
    const Container = ({ a, b }: any) =>
      h(
        JssProvider,
        {
          registry,
        },
        () => [
          h(ThemeProvider, { theme: a }, () =>
            h(ThemedDynamicComponent, { backgroundColor: '#fff' }),
          ),
          h(ThemeProvider, { theme: b }, () =>
            h(ThemedDynamicComponent, { backgroundColor: '#fff' }),
          ),
        ],
      )

    // (
    //   <JssProvider registry={registry}>
    //     <ThemeProvider theme={a}>
    //       <ThemedDynamicComponent backgroundColor="#fff" />
    //     </ThemeProvider>
    //     <ThemeProvider theme={b}>
    //       <ThemedDynamicComponent backgroundColor="#fff" />
    //     </ThemeProvider>
    //   </JssProvider>
    // )

    const renderer = mount(Container, {
      props: {
        a: themeA,
        b: themeB,
      },
    })

    expect(registry.registry.length).toEqual(2)

    renderer.setProps({
      a: themeA,
      b: themeA,
    })

    return nextTick(() => {
      expect(registry.registry[1].attached).toEqual(false)
      expect(registry.registry.length).toEqual(2)
    })
  })

  describe('when theming object returned from createTheming is provided to injectSheet options', () => {
    it('allows nested ThemeProviders with custom namespace', () => {
      const themingA = createTheming('themeA', {})
      const themingB = createTheming('themeB', {})
      const { ThemeProvider: ThemeProviderA } = themingA
      const { ThemeProvider: ThemeProviderB } = themingB

      let colorReceivedInStylesA
      let colorReceivedInStylesB
      let themeReceivedInComponentA
      let themeReceivedInComponentB

      const stylesA = (theme: any) => {
        colorReceivedInStylesA = theme.color
      }
      const stylesB = (theme: any) => {
        colorReceivedInStylesB = theme.color
      }

      const ComponentA = createStyledComponent(stylesA, { theming: themingA })
      const getThemeA = (theme: any) => {
        themeReceivedInComponentA = theme
      }
      const ComponentB = createStyledComponent(stylesB, { theming: themingB })
      const getThemeB = (theme: any) => {
        themeReceivedInComponentB = theme
      }

      const Container = ({ a, b }: any) =>
        h(
          ThemeProviderA,
          {
            theme: a,
          },
          () =>
            h(
              ThemeProviderB,
              {
                theme: b,
              },
              () =>
                h('div', [
                  h(ComponentA, { getTheme: getThemeA }),
                  h(ComponentB, { getTheme: getThemeB }),
                ]),
            ),
        )

      // (
      //   <ThemeProviderA theme={a}>
      //     <ThemeProviderB theme={b}>
      //       <div>
      //         <ComponentA getTheme={getThemeA} />
      //         <ComponentB getTheme={getThemeB} />
      //       </div>
      //     </ThemeProviderB>
      //   </ThemeProviderA>
      // )

      mount(Container, {
        props: {
          a: themeA,
          b: themeB,
        },
      })

      expect(themeReceivedInComponentA).toEqual(themeA)
      expect(themeReceivedInComponentB).toEqual(themeB)
      expect(colorReceivedInStylesA).toEqual(themeA.color)
      expect(colorReceivedInStylesB).toEqual(themeB.color)
    })
  })
})
