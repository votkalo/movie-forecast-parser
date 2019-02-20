class ParseUtil {
    static async selectElement(element, selector) {
        try {
            return await element.$(selector)
        } catch (error) {
            return null
        }
    }

    static async selectElementInnerText(element, selector) {
        try {
            return await element.$eval(selector, node => node.innerText)
        } catch (error) {
            return null
        }
    }

    static async selectElementProperty(element, property) {
        try {
            return await (await element.getProperty(property)).jsonValue()
        } catch (error) {
            return null
        }
    }

    static notEmptyOrNull(value) {
        if (value === '') {
            return null
        }
        return value
    }
}

module.exports = ParseUtil;
