import { generatedProjectFileName } from '../components/utils/generatedMetamodelProject';

export const downloadGeneratedProject = (project: any, fileName: string) => {
        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = generatedProjectFileName(fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
      };

export const chooseGeneratedProjectFile = (): Promise<{ project: any; fileName: string } | null> =>
        new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json,application/json';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return resolve(null);
            try {
              resolve({ project: JSON.parse(await file.text()), fileName: file.name });
            } catch (_) {
              alert('The selected file is not valid JSON.');
              resolve(null);
            }
          };
          input.oncancel = () => resolve(null);
          input.click();
        });
