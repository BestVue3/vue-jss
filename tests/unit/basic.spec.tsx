// import { mount } from '@vue/test-utils'
import createBaseTests from '../../test-utils/createBaseTests'

import createUseStyles from '../../lib/createUseStyles'

const createStyledComponent = (styles: any, options: any) => {
  const useStyles = createUseStyles(styles, options)
  const Comp = {
    setup(props: any) {
      useStyles(props)
      return () => null
    },
  }
  return Comp
}

describe('vue-JSS: createUseStyles', () => {
  createBaseTests({ createStyledComponent })
})

// const Comp = () => <div>123</div>

// describe('datetime', () => {
//   it('should work', () => {
//     const wrapper = mount(Comp)

//     expect(wrapper.find('div').text()).toBe('123')
//   })
// })
