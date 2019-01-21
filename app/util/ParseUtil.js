class ParseUtil {
    static async selectElement(element, selector) {
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
}

module.exports = ParseUtil;
