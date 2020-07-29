/* eslint-disable global-require, react/prop-types, no-underscore-dangle */
import { mount } from '@vue/test-utils'
import { spy } from 'sinon'
import { stripIndent } from 'common-tags'

import { JssProvider, SheetsRegistry } from '../../lib'

export default ({ createStyledComponent }: any) => {
  it('should reuse one static sheet for many elements and detach sheet', () => {
    const registry: any = new SheetsRegistry()
    const MyComponent = createStyledComponent({
      button: { color: 'red' },
    })

    const Demo = () => (
      <JssProvider registry={registry}>
        <MyComponent />
        <MyComponent />
        <MyComponent />
      </JssProvider>
    )

    const wrapper = mount(Demo)

    expect(registry.registry.length).toEqual(1)
  })

  // it('should register style sheets when `renderToString`', () => {
  //   const registry = new SheetsRegistry()
  //   const MyComponent = createStyledComponent({
  //     button: { color: 'red' },
  //   })
  //   const generateId = () => 'id'
  //   renderToString(
  //     <JssProvider registry={registry} generateId={generateId}>
  //       <MyComponent />
  //     </JssProvider>,
  //   )

  //   expect(registry.toString()).to.be(stripIndent`
  //     .id {
  //       color: red;
  //     }
  //   `)
  // })

  it('should use passed options.generateId', () => {
    const registry = new SheetsRegistry()
    const options = {
      generateId: (rule: any) => `ui-${rule.key}`,
    }
    const MyComponent = createStyledComponent(
      {
        button: { color: 'red' },
      },
      options,
    )

    const Demo = () => (
      <JssProvider registry={registry}>
        <MyComponent />
      </JssProvider>
    )

    mount(Demo)
    expect(registry.toString()).toBe(stripIndent`
      .ui-button {
        color: red;
      }
    `)
  })

  describe('preserving source order', () => {
    let ComponentA: any
    let ComponentB: any
    let ComponentC: any
    let registry: any

    beforeEach(() => {
      registry = new SheetsRegistry()
      ComponentA = createStyledComponent({
        button: { color: 'red' },
      })
      ComponentB = createStyledComponent({
        button: { color: 'blue' },
      })
      ComponentC = createStyledComponent(
        {
          button: { color: 'green' },
        },
        { index: 1234 },
      )
    })

    it('should provide a default index in ascending order', () => {
      const Demo = () => (
        <JssProvider registry={registry}>
          <ComponentA />
          <ComponentB />
        </JssProvider>
      )

      const wrapper = mount(Demo)

      expect(registry.registry.length).toEqual(2)
      const indexA = registry.registry[0].options.index
      const indexB = registry.registry[1].options.index

      expect(indexA).toBeLessThan(indexB)
    })

    it('should not be affected by rendering order', () => {
      const Demo = () => {
        return (
          <JssProvider registry={registry}>
            <ComponentB />
            <ComponentA />
          </JssProvider>
        )
      }

      const wrapper = mount(Demo)

      expect(registry.registry.length).toEqual(2)
      const indexA = registry.registry[0].options.index
      const indexB = registry.registry[1].options.index

      expect(indexA).toBeLessThan(indexB)
    })

    it('should keep custom index', () => {
      const Demo = () => (
        <JssProvider registry={registry}>
          <ComponentC />
        </JssProvider>
      )

      const wrappper = mount(Demo)

      expect(registry.registry.length).toEqual(1)
      const indexC = registry.registry[0].options.index
      expect(indexC).toEqual(1234)
    })
  })

  describe('properly warn about themed styles misuse', () => {
    beforeEach(() => {
      spy(console, 'warn')
    })

    afterEach(() => {
      ;(console as any).warn.restore()
    })

    it('warn if themed styles dont use theme', () => {
      const MyComponent = createStyledComponent(() => ({}), { name: 'Comp' })

      const Demo = () => <MyComponent theme={{}} />

      mount(Demo)

      expect(
        (console as any).warn.calledWithExactly(
          `Warning: [JSS] <Comp />'s styles function doesn't rely on the "theme" argument. We recommend declaring styles as an object instead.`,
        ),
      ).toBe(true)
    })

    it('should not warn if themed styles _do use_ theme', () => {
      const MyComponent = createStyledComponent((theme: any) => ({})) // eslint-disable-line no-unused-vars

      const Demo = () => <MyComponent theme={{}} />

      mount(Demo)

      expect((console as any).warn.called).toBe(false)
    })
  })

  describe('classNamePrefix', () => {
    let classNamePrefix: string
    const generateId = (rule: any, sheet: any) => {
      classNamePrefix = sheet.options.classNamePrefix
      return `${rule.key}-id`
    }

    const renderTest = (name = 'DisplayNameTest') => {
      const MyComponent = createStyledComponent(
        {
          a: { color: 'red' },
        },
        { name },
      )

      const Demo = () => (
        <JssProvider generateId={generateId}>
          <MyComponent />
        </JssProvider>
      )

      mount(Demo)
    }

    it('should pass displayName as prefix', () => {
      renderTest()
      expect(classNamePrefix).toBe('DisplayNameTest-')
    })

    it('should handle spaces correctly', () => {
      renderTest('Display Name Test')
      expect(classNamePrefix).toBe('Display-Name-Test-')
    })
  })
}
