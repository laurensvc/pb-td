import { areaDefinitions, areaTierKey } from './content';
function previousAreaId(areaId) {
    const index = areaDefinitions.findIndex((area) => area.id === areaId);
    if (index <= 0)
        return areaId;
    return areaDefinitions[index - 1].id;
}
export function isTierUnlocked(save, areaId, tierId) {
    if (tierId === 'normal')
        return (areaDefinitions.findIndex((area) => area.id === areaId) === 0 ||
            save.clearedAreaTiers.includes(areaTierKey(previousAreaId(areaId), 'normal')));
    return save.clearedAreaTiers.includes(areaTierKey(areaId, 'normal'));
}
