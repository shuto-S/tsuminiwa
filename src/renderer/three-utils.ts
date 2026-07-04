// Three.js まわりの小さなユーティリティ
import * as THREE from 'three';

// グループの子をすべて破棄する。共有アセット(constructor で作った
// ジオメトリ・マテリアル・テクスチャ)は破棄されないよう、
// group 直下に置かず makeXxx() の中だけで new したものに使うこと。
// マテリアルの .map(テクスチャ)は dispose しない = 共有キャッシュは守られる。
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of materials) m.dispose();
    }
  });
}

// グループの中身を破棄してから空にする
export function clearGroup(group: THREE.Object3D): void {
  disposeObject(group);
  group.clear();
}
