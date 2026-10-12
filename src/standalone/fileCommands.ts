import type { EditorHostAccess } from '../editorHost/access';
import { ReadModelFromFile, ReadMetamodelFromFile } from '../components/utils/ReadModelFromFile';
import { SaveAllToFile, SaveAllToFileDate, SaveModelToFile, SaveModelviewToFile, SaveMetamodelToFile } from '../components/utils/SaveModelToFile';

export interface JsonFileExport {
    kind: 'project' | 'model' | 'modelview' | 'metamodel';
    data: unknown;
    name: string;
    type: string;
    universe?: string;
    dated?: boolean;
}
export interface StandaloneFileCommands {
    /** Starts the legacy reader; its completion callback applies imported state. */
    importFile(file: File, kind: 'model' | 'metamodel'): Promise<void>;
    exportJson(request: JsonFileExport): void;
}
/** Browser/file policy stays in the standalone host; readers retain existing format adapters. */
export const createStandaloneFileCommands = (host: EditorHostAccess): StandaloneFileCommands => ({
    async importFile(file, kind) {
        const event = { preventDefault() {}, target: { files: [file], value: '' } };
        const reader = kind === 'metamodel' ? ReadMetamodelFromFile : ReadModelFromFile;
        await reader(host.getState(), (action: Parameters<EditorHostAccess['dispatch']>[0]) => host.dispatch(action), event, host);
    },
    exportJson(request) {
        const save = request.kind === 'project'
            ? (request.dated ? SaveAllToFileDate : SaveAllToFile)
            : request.kind === 'model' ? SaveModelToFile
            : request.kind === 'modelview' ? SaveModelviewToFile : SaveMetamodelToFile;
        save(request.data, request.name, request.type, request.universe || '');
    },
});
