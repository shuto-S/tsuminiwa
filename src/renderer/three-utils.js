// Three.js まわりの小さなユーティリティ

// グループの子をすべて破棄する。共有アセット(constructor で作った
// ジオメトリ・マテリアル・テクスチャ)は破棄されないよう、
// group 直下に置かず makeXxx() の中だけで new したものに使うこと。
// マテリアルの .map(テクスチャ)は dispose しない = 共有キャッシュは守られる。
export function disposeObject(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of materials) m.dispose();
    }
  });
}

// グループの中身を破棄してから空にする
export function clearGroup(group) {
  disposeObject(group);
  group.clear();
}
