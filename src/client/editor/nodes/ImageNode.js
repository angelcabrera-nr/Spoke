import THREE from "../../vendor/three";
import EditorNodeMixin from "./EditorNodeMixin";
import Image from "../objects/Image";

export default class ImageNode extends EditorNodeMixin(Image) {
  static legacyComponentName = "image";

  static nodeName = "Image";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { src, projection } = json.components.find(c => c.name === "image").props;

    await node.load(src);
    node.projection = projection;

    return node;
  }

  constructor(editor) {
    super(editor);

    this._canonicalUrl = null;
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value).catch(console.error);
  }

  onChange() {
    this.onResize();
  }

  loadTexture(src) {
    return this.editor.textureCache.get(src);
  }

  async load(src) {
    this._canonicalUrl = src;
    const { accessibleUrl } = await this.editor.project.resolveMedia(src);
    return super.load(accessibleUrl);
  }

  copy(source, recursive) {
    super.copy(source, recursive);

    this._canonicalUrl = source._canonicalUrl;

    return this;
  }

  serialize() {
    const json = super.serialize();

    json.components.push({
      name: "image",
      props: {
        src: this._canonicalUrl,
        projection: this.projection
      }
    });

    return json;
  }

  prepareForExport() {
    const replacementObject = new THREE.Object3D().copy(this, false);

    replacementObject.userData.gltfExtensions = {
      HUBS_components: {
        image: {
          src: this._canonicalUrl,
          projection: this.projection
        },
        networked: {
          id: this.uuid
        }
      }
    };

    this.parent.add(replacementObject);
    this.parent.remove(this);
  }
}
