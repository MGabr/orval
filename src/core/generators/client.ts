import { OutputClient, OutputOptions } from '../../types';
import {
  GeneratorClientExtra,
  GeneratorOperations,
  GeneratorOptions,
  GeneratorVerbsOptions,
} from '../../types/generator';
import { pascal } from '../../utils/case';
import {
  generateAngular,
  generateAngularFooter,
  generateAngularHeader,
  generateAngularImports,
  generateAngularTitle,
} from './angular';
import {
  generateAxios,
  generateAxiosFooter,
  generateAxiosHeader,
  generateAxiosImports,
  generateAxiosTitle,
} from './axios';
import { generateMSW } from './msw';
import {
  generateReactQuery,
  generateReactQueryFooter,
  generateReactQueryHeader,
  generateReactQueryImports,
  generateReactQueryTitle,
} from './react-query';

const DEFAULT_CLIENT = OutputClient.AXIOS;

const GENERATOR_CLIENT = {
  [OutputClient.AXIOS]: {
    client: generateAxios,
    msw: generateMSW,
    header: generateAxiosHeader,
    imports: generateAxiosImports,
    footer: generateAxiosFooter,
    title: generateAxiosTitle,
  },
  [OutputClient.ANGULAR]: {
    client: generateAngular,
    msw: generateMSW,
    header: generateAngularHeader,
    imports: generateAngularImports,
    footer: generateAngularFooter,
    title: generateAngularTitle,
  },
  [OutputClient.REACT_QUERY]: {
    client: generateReactQuery,
    msw: generateMSW,
    header: generateReactQueryHeader,
    imports: generateReactQueryImports,
    footer: generateReactQueryFooter,
    title: generateReactQueryTitle,
  },
};
export const generateClientImports = ({
  client = DEFAULT_CLIENT,
  override,
}: OutputOptions = {}): GeneratorClientExtra => {
  return {
    implementation: GENERATOR_CLIENT[client].imports(!!override?.mutator),
    implementationMSW: `import { rest } from 'msw'
    import faker from 'faker'\n`,
  };
};

export const generateClientHeader = (
  outputClient: OutputClient = DEFAULT_CLIENT,
  title: string,
  customTitleFunc?: (title: string) => string,
): GeneratorClientExtra => {
  const titles = generateClientTitle(outputClient, title, customTitleFunc);
  return {
    implementation: GENERATOR_CLIENT[outputClient].header(
      titles.implementation,
    ),
    implementationMSW: `export const ${titles.implementationMSW} = () => [\n`,
  };
};

export const generateClientFooter = (
  outputClient: OutputClient = DEFAULT_CLIENT,
): GeneratorClientExtra => {
  return {
    implementation: GENERATOR_CLIENT[outputClient].footer(),
    implementationMSW: `]\n`,
  };
};

export const generateClientTitle = (
  outputClient: OutputClient = DEFAULT_CLIENT,
  title: string,
  customTitleFunc?: (title: string) => string,
) => {
  if (customTitleFunc) {
    const customTitle = customTitleFunc(title);
    return {
      implementation: GENERATOR_CLIENT[outputClient].title(customTitle),
      implementationMSW: `get${pascal(customTitle)}MSW`,
    };
  }
  return {
    implementation: GENERATOR_CLIENT[outputClient].title(title),
    implementationMSW: `get${pascal(title)}MSW`,
  };
};

export const generateClient = (
  outputClient: OutputClient = DEFAULT_CLIENT,
  verbsOptions: GeneratorVerbsOptions,
  options: GeneratorOptions,
): GeneratorOperations => {
  return verbsOptions.reduce((acc, verbOption) => {
    const generator = GENERATOR_CLIENT[outputClient];
    const client = generator.client(verbOption, options);
    const msw = generator.msw(verbOption, options);

    return {
      ...acc,
      [verbOption.operationId]: {
        implementation: client.implementation,
        imports: client.imports,
        implementationMSW: msw.implementation,
        importsMSW: msw.imports,
        tags: verbOption.tags,
        mutator: verbOption.mutator,
      },
    };
  }, {});
};
