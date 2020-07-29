// /* eslint-disable global-require, react/prop-types, react/no-find-dom-node, react/no-multi-comp, react/prefer-stateless-function */

// import expect from 'expect.js'
// import React from 'react'
// import TestRenderer from 'react-test-renderer'
import { stripIndent } from 'common-tags'

import { mount } from '@vue/test-utils'

import { JssProvider, SheetsRegistry } from '../../lib'
import { nextTick, h, Fragment } from 'vue'

const createGenerateId = () => {
  let counter = 0
  return (rule: any) => `${rule.key}-${counter++}`
}

export default ({ createStyledComponent }: any) => {
  let registry: any

  beforeEach(() => {
    registry = new SheetsRegistry()
  })

  describe('function values', () => {
    let MyComponent: any
    let classes: any

    beforeEach(() => {
      MyComponent = createStyledComponent(
        {
          button: {
            color: 'rgb(255, 255, 255)',
            height: ({ height = 1 }) => `${height}px`,
            '&::before': {
              content: '""',
              height: ({ height = 1 }) => {
                // console.log('final height', height)
                return `${height}px`
              },
            },
          },
        },
        { name: 'NoRenderer' },
        (cls: any) => {
          classes = cls
        },
      )
    })

    // TODO: https://github.com/vuejs/vue-test-utils-next/issues/163
    // it('should attach and detach a sheet', () => {
    //   const Demo = {
    //     setup() {
    //       return () => h(JssProvider, { registry }, () => h(MyComponent))

    //       // (
    //       //     <JssProvider registry={registry}>
    //       //       <MyComponent />
    //       //     </JssProvider>
    //       // )
    //     }
    //   }

    //   const wrapper = mount(Demo)

    //   expect(registry.registry.length).toEqual(1)
    //   expect(registry.registry[0].attached).toEqual(true)

    //   wrapper.unmount()

    //   expect(registry.registry[0].attached).toEqual(false)
    // })

    it('should have correct meta attribute', () => {
      const Demo = () => (
        <JssProvider registry={registry}>
          <MyComponent />
        </JssProvider>
      )

      mount(Demo)

      expect(registry.registry[0].options.meta).toEqual('NoRenderer, Unthemed')
    })

    it('should reuse sheet between component instances', () => {
      mount(() => (
        <JssProvider registry={registry}>
          <MyComponent height={2} />
          <MyComponent height={3} />
        </JssProvider>
      ))

      expect(registry.registry.length).toEqual(1)
    })

    it('should have dynamic and static styles', () => {
      mount(() => (
        <JssProvider generateId={createGenerateId()} registry={registry}>
          <MyComponent />
        </JssProvider>
      ))

      expect(classes.button).toEqual('button-0 button-d0-1')
    })

    it('should generate different dynamic values', () => {
      mount(() => (
        <JssProvider registry={registry} generateId={createGenerateId()}>
          <MyComponent height={10} />
          <MyComponent height={20} />
        </JssProvider>
      ))

      expect(registry.toString()).toEqual(stripIndent`
        .button-0 {
          color: rgb(255, 255, 255);
        }
        .button-0::before {
          content: "";
        }
        .button-d0-1 {
          height: 10px;
        }
        .button-d0-1::before {
          height: 10px;
        }
        .button-d1-2 {
          height: 20px;
        }
        .button-d1-2::before {
          height: 20px;
        }
      `)
    })

    it('should update dynamic values', done => {
      const generateId = createGenerateId()
      const Container = (props: any) => {
        // return <JssProvider registry={registry} generateId={generateId}>
        //   <MyComponent height={props.height} />
        //   <MyComponent height={props.height * 2} />
        // </JssProvider>
        return h(JssProvider, { registry, generateId }, () => [
          h(MyComponent, { height: props.height }),
          h(MyComponent, { height: props.height * 2 }),
        ])
      }
      const wrapper = mount(Container, {
        props: {
          height: 10,
        },
      })

      expect(registry.toString()).toEqual(stripIndent`
        .button-0 {
          color: rgb(255, 255, 255);
        }
        .button-0::before {
          content: "";
        }
        .button-d0-1 {
          height: 10px;
        }
        .button-d0-1::before {
          height: 10px;
        }
        .button-d1-2 {
          height: 20px;
        }
        .button-d1-2::before {
          height: 20px;
        }
      `)

      wrapper.setProps({
        height: 20,
      })

      nextTick(() => {
        expect(registry.toString()).toEqual(stripIndent`
          .button-0 {
            color: rgb(255, 255, 255);
          }
          .button-0::before {
            content: "";
          }
          .button-d0-1 {
            height: 20px;
          }
          .button-d0-1::before {
            height: 20px;
          }
          .button-d1-2 {
            height: 40px;
          }
          .button-d1-2::before {
            height: 40px;
          }
        `)
        done()
      })
    })

    it('should unset values when null is returned from fn value', done => {
      const generateId = createGenerateId()

      MyComponent = createStyledComponent({
        button: {
          width: 10,
          height: ({ height }: any) => height,
        },
      })

      const Container = ({ height }: any) =>
        h(JssProvider, { registry, generateId }, () =>
          h(MyComponent, { height }),
        )

      // (
      //   <JssProvider registry={registry} generateId={generateId}>
      //     <MyComponent height={height} />
      //   </JssProvider>
      // )

      const wrapper = mount(Container, {
        props: {
          height: 10,
        },
      })

      expect(registry.toString()).toEqual(stripIndent`
        .button-0 {
          width: 10px;
        }
        .button-d0-1 {
          height: 10px;
        }
      `)

      // renderer.update(<Container height={null} />)
      wrapper.setProps({
        height: null,
      })

      nextTick(() => {
        expect(registry.toString()).toEqual(stripIndent`
          .button-0 {
            width: 10px;
          }
          .button-d0-1 {}
        `)
        done()
      })
    })

    it('should unset values when null is returned from fn rule', () => {
      const generateId = createGenerateId()
      MyComponent = createStyledComponent({
        button0: {
          width: 10,
        },
        button1: ({ height }: any) => ({
          height,
        }),
      })

      const Container = ({ height }: any) => {
        return h(JssProvider, { registry, generateId }, () =>
          h(MyComponent, { height }),
        )
      }

      // (
      //   <JssProvider registry={registry} generateId={generateId}>
      //     <MyComponent height={height} />
      //   </JssProvider>
      // )

      const renderer = mount(Container, {
        props: {
          height: 10,
        },
      })

      expect(registry.toString()).toEqual(stripIndent`
        .button0-0 {
          width: 10px;
        }
        .button1-1 {}
        .button1-d0-2 {
          height: 10px;
        }
      `)

      // TODO: setProps is async?
      renderer.setProps({
        height: null,
      })

      return nextTick(() => {
        expect(registry.toString()).toEqual(stripIndent`
          .button0-0 {
            width: 10px;
          }
          .button1-1 {}
          .button1-d0-2 {}
        `)
      })
    })

    it('should pass the props of the component', () => {
      let passedProps: any

      const styles = {
        a: {
          color(props: any) {
            passedProps = props
            return 'rgb(255, 255, 255)'
          },
        },
      }

      MyComponent = createStyledComponent(styles)

      mount(MyComponent, {
        props: {
          height: 20,
        },
      })

      expect(passedProps.height).toEqual(20)
    })

    // TODO: fix this
    it('should update rules with a nested media query in a list', () => {
      const ListItem = createStyledComponent({
        container: {
          display: 'block',
          // color: ({color}: any) => color,
          '@media (min-width: 0px)': {
            color: ({ color }: any) => color,
          },
        },
      })

      MyComponent = ({ colors }: any) =>
        h(
          Fragment,
          colors.map((color: any) => h(ListItem, { key: color, color })),
        )

      const generateId = createGenerateId()

      const Container = ({ colors }: any) =>
        h(JssProvider, { generateId, registry }, () =>
          h(MyComponent, { colors }),
        )

      const wrapper = mount(Container, {
        props: {
          colors: ['red', 'green'],
        },
      })

      expect(registry.toString()).toEqual(stripIndent`
        .container-0 {
          display: block;
        }
        @media (min-width: 0px) {
          .container-0 {  }
        }
          .container-d0-1 {  }
        @media (min-width: 0px) {
          .container-d0-1 {
            color: red;
          }
        }
          .container-d2-2 {  }
        @media (min-width: 0px) {
          .container-d2-2 {
            color: green;
          }
        }
      `)

      wrapper.setProps({
        colors: ['blue'],
      })

      return nextTick(() =>
        expect(registry.toString()).toEqual(stripIndent`
        .container-0 {
          display: block;
        }
        @media (min-width: 0px) {
          .container-0 {  }
        }
          .container-d4-3 {  }
        @media (min-width: 0px) {
          .container-d4-3 {
            color: blue;
          }
        }
      `),
      )
    })

    it('should update rules inside a media query in a list', () => {
      const ListItem = createStyledComponent({
        '@media (min-width: 0px)': {
          container: {
            display: 'block',
            color: ({ color }: any) => color,
          },
        },
      })

      MyComponent = ({ colors }: any) =>
        h(
          Fragment,
          colors.map((color: string) => h(ListItem, { key: color, color })),
        )

      const generateId = createGenerateId()

      const Container = ({ colors }: any) =>
        h(JssProvider, { generateId, registry }, () =>
          h(MyComponent, { colors }),
        )

      const wrapper = mount(Container, {
        props: {
          colors: ['red', 'green'],
        },
      })

      expect(registry.toString()).toEqual(stripIndent`
        @media (min-width: 0px) {
          .container-0 {
            display: block;
          }
        }
        @media (min-width: 0px) {
          .container-0 {
            color: red;
          }
        }
        @media (min-width: 0px) {
          .container-0 {
            color: green;
          }
        }
      `)

      wrapper.setProps({
        colors: ['blue'],
      })

      return nextTick(() =>
        expect(registry.toString()).toEqual(stripIndent`
        @media (min-width: 0px) {
          .container-0 {
            display: block;
          }
        }
        @media (min-width: 0px) {
          .container-0 {
            color: blue;
          }
        }
      `),
      )
    })
  })

  describe('function rules', () => {
    let MyComponent: any
    let classes: any

    beforeEach(() => {
      MyComponent = createStyledComponent(
        {
          button: ({ height = 1 }) => ({
            color: 'rgb(255, 255, 255)',
            height: `${height}px`,
          }),
        },
        { name: 'NoRenderer' },
        (cls: any) => {
          classes = cls
        },
      )
    })

    it('should attach and detach a sheet', () => {
      // TODO: https://github.com/vuejs/vue-test-utils-next/issues/163
      const wrapper = mount(() => (
        <div>
          <JssProvider registry={registry}>
            <MyComponent />
          </JssProvider>
        </div>
      ))

      expect(registry.registry.length).toEqual(1)
      expect(registry.registry[0].attached).toEqual(true)

      wrapper.unmount()

      expect(registry.registry[0].attached).toEqual(false)
    })

    it('should have correct meta attribute', () => {
      mount(() => (
        <JssProvider registry={registry}>
          <MyComponent />
        </JssProvider>
      ))

      expect(registry.registry[0].options.meta).toEqual('NoRenderer, Unthemed')
    })

    it('should reuse static sheet, but generate separate dynamic once', () => {
      mount(() => (
        <JssProvider registry={registry}>
          <MyComponent height={2} />
          <MyComponent height={3} />
        </JssProvider>
      ))

      expect(registry.registry.length).toEqual(1)
    })

    it('should have dynamic and static styles', () => {
      mount(() => (
        <JssProvider generateId={createGenerateId()}>
          <MyComponent />
        </JssProvider>
      ))
      expect(classes.button).toEqual('button-0 button-d0-1')
    })

    it('should generate different dynamic values', () => {
      mount(() => (
        <JssProvider registry={registry} generateId={createGenerateId()}>
          <MyComponent height={10} />
          <MyComponent height={20} />
        </JssProvider>
      ))

      expect(registry.toString()).toEqual(stripIndent`
        .button-0 {}
        .button-d0-1 {
          color: rgb(255, 255, 255);
          height: 10px;
        }
        .button-d1-2 {
          color: rgb(255, 255, 255);
          height: 20px;
        }
      `)
    })

    it('should update dynamic values', () => {
      const generateId = createGenerateId()
      function Container({ height }: any) {
        return h(
          JssProvider,
          { registry, generateId },
          {
            default: () => [
              h(MyComponent, { height }),
              h(MyComponent, { height: height * 2 }),
            ],
          },
        )

        // (
        //   <JssProvider registry={registry} generateId={generateId}>
        //     <MyComponent height={height} />
        //     <MyComponent height={height * 2} />
        //   </JssProvider>
        // )
      }

      const wrapper = mount(Container, {
        props: {
          height: 10,
        },
      })

      expect(registry.toString()).toEqual(stripIndent`
        .button-0 {}
        .button-d0-1 {
          color: rgb(255, 255, 255);
          height: 10px;
        }
        .button-d1-2 {
          color: rgb(255, 255, 255);
          height: 20px;
        }
      `)

      wrapper.setProps({
        height: 20,
      })

      return nextTick(() =>
        expect(registry.toString()).toEqual(stripIndent`
        .button-0 {}
        .button-d0-1 {
          color: rgb(255, 255, 255);
          height: 20px;
        }
        .button-d1-2 {
          color: rgb(255, 255, 255);
          height: 40px;
        }
      `),
      )
    })

    it('should use the default props', () => {
      let passedProps: any

      const styles = {
        button(props: any) {
          passedProps = props
          return { color: 'rgb(255, 255, 255)' }
        },
      }

      MyComponent = createStyledComponent(styles)
      // MyComponent.defaultProps = {
      //   color: 'rgb(255, 0, 0)'
      // }
      mount(MyComponent, {
        props: {
          height: 20,
        },
      })

      // expect(passedProps.color).toEqual('rgb(255, 0, 0)')
      expect(passedProps.height).toEqual(20)
    })
  })
}
